import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON bodies
  app.use(express.json());

  // API router goes FIRST
  
  // Endpoint to split teams and generate creative names & slogans via Gemini AI
  app.post("/api/gemini/teams", async (req, res) => {
    try {
      const { members, teamCount, theme, mood } = req.body;
      if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "Danh sách thành viên không hợp lệ." });
      }
      const count = parseInt(teamCount) || 2;
      const selectedTheme = theme || "Funny animals";
      const selectedMood = mood || "Hài hước, năng động";

      // Perform a clean, fair split of the members in TS first
      const shuffled = [...members].sort(() => Math.random() - 0.5);
      const teamsList: { teamIndex: number; members: string[] }[] = Array.from({ length: count }, (_, i) => ({
        teamIndex: i + 1,
        members: [],
      }));

      shuffled.forEach((member, index) => {
        teamsList[index % count].members.push(member);
      });

      // Now query Gemini to enrich these divided groups with creative names, slogans and emojis!
      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        // Fallback name/slogan if API Key is not set or misconfigured
        const fallbackThemes: Record<string, { names: string[]; slogans: string[]; emojis: string[] }> = {
          default: {
            names: ["Hổ Lửa", "Sư Tử Vàng", "Đại Bàng Xanh", "Cá Mập Thép", "Phượng Hoàng", "Rồng Thần"],
            slogans: ["Chiến thắng là duy nhất", "Đoàn kết là sức mạnh", "Bứt phá mọi giới hạn", "Không lùi bước", "Khát khao chiến thắng", "Làm hết sức chơi hết mình"],
            emojis: ["🔥", "🦁", "🦅", "🦈", "🔥", "🐉"],
          }
        };
        const fallbacks = fallbackThemes.default;
        const enrichedTeams = teamsList.map((team, idx) => {
          const name = fallbacks.names[idx % fallbacks.names.length] + ` ${team.teamIndex}`;
          const slogan = fallbacks.slogans[idx % fallbacks.slogans.length];
          const emoji = fallbacks.emojis[idx % fallbacks.emojis.length];
          return {
            teamName: name,
            slogan,
            emoji,
            members: team.members,
          };
        });
        return res.json({ teams: enrichedTeams, warning: "Chưa cấu hình GEMINI_API_KEY. Đang dùng mẫu ngẫu nhiên mặc định." });
      }

      // Prepare AI Prompt
      const systemInstruction = `Bạn là một trợ lý ảo siêu hài hước, độc đáo chuyên thiết kế tên đội nhóm và slogan sáng tạo tiếng Việt cho hoạt động teambuilding doanh nghiệp.
Mục tiêu: Đặt tên đội nhóm, khẩu hiệu (slogan) cực chất và vui nhộn dựa trên chủ đề (theme) và phong thái (mood) do người dùng yêu cầu.
Ngôn ngữ phản hồi: Toàn bộ tên đội, slogan và phản hồi phải bằng Tiếng Việt thân thiện, sáng tạo và tự nhiên.`;

      const prompt = `Hãy đặt tên đội, viết khẩu hiệu (slogan) teambuilding hài hước và chọn 1 emoji phù hợp cho các đội sau đây.
Yêu cầu chủ đề (Theme): "${selectedTheme}"
Phong thái (Mood): "${selectedMood}"

Thông tin các đội đã chia ngẫu nhiên:
${teamsList.map(t => `Đội ${t.teamIndex}: gồm các thành viên [${t.members.join(", ")}]`).join("\n")}

Hãy trả về kết quả dưới định dạng JSON là một mảng gồm các đối tượng có thuộc tính:
- teamName (chuỗi: tên đội sáng tạo theo chủ đề đã Việt hóa hài hước hoặc bắt trend)
- slogan (chuỗi: khẩu hiệu siêu ngắn gọn, vui nhộn, vần điệu để hô khẩu hiệu dễ dàng)
- emoji (chuỗi: một emoji đại diện duy nhất)
- members (mảng chứa các tên thành viên tương ứng từ dữ liệu đầu vào của đội đó)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              teams: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    teamName: { type: Type.STRING },
                    slogan: { type: Type.STRING },
                    emoji: { type: Type.STRING },
                    members: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["teamName", "slogan", "emoji", "members"]
                }
              }
            },
            required: ["teams"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultObj = JSON.parse(responseText.trim());
      res.json({ teams: resultObj.teams || teamsList.map((t, idx) => ({ teamName: `Đội ${t.teamIndex}`, slogan: "Đoàn kết là sức mạnh", emoji: "🏆", members: t.members })) });

    } catch (error: any) {
      console.error("Lỗi API chia đội:", error);
      res.status(500).json({ error: error.message || "Đã xảy ra lỗi khi xử lý yêu cầu chia đội." });
    }
  });

  // Endpoint to generate customized "Truth or Dare" or "Icebreaker" prompts
  app.post("/api/gemini/challenges", async (req, res) => {
    try {
      const { category, topic, customContext } = req.body;
      const typeLabel = category === "truth" ? "Thật (Truth)" : category === "dare" ? "Thách (Dare)" : "Icebreaker (Phá băng khởi động)";
      const contextText = customContext ? `Đối tượng người chơi: ${customContext}.` : "";
      const topicText = topic ? `Chủ đề hoặc không khí mong muốn: ${topic}.` : "";

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err) {
        // Fallback prompts if API Key is not set
        const fallbacks: Record<string, string[]> = {
          truth: [
            "Bí mật lớn nhất bạn đang giấu đồng nghiệp ngồi ngay bên cạnh là gì?",
            "Nếu được đổi vị trí với sếp trong 1 ngày, việc đầu tiên bạn sẽ làm là gì?",
            "Lần gần nhất bạn giả vờ bận rộn để né công việc ở công ty là khi nào?",
            "Ai là người bạn cảm thấy có ấn tượng đầu tiên khác biệt nhất trong đội?",
            "Thói quen kỳ quặc nào tại nơi làm việc mà chưa ai phát hiện ra ở bạn?",
          ],
          dare: [
            "Hát một đoạn nhạc thiếu nhi bằng phong cách nhạc Rock!",
            "Nhắn tin cho sếp hoặc đồng nghiệp nói lời yêu thương chân thành ngay lập tức!",
            "Uống cạn một ly nước lọc trong 5 giây và tạo dáng 'siêu mẫu thế giới'!",
            "Hãy kể một câu chuyện cười trong vòng 30 giây mà không ai được cười (kể cả bạn)!",
            "Biểu diễn tư thế Yoga khó nhất bạn biết hoặc đứng thăng bằng 1 chân trong 40 giây!",
          ],
          icebreaker: [
            "Nếu cả đội bị lạc hoang đảo đột ngột, ai sẽ là người sinh tồn lâu nhất và tại sao?",
            "Kể tên 3 đồ vật bất ly thân trên bàn làm việc của bạn trong 5 giây!",
            "Nếu bạn có siêu năng lực sao chép kỹ năng của 1 thành viên trong phòng, bạn chọn của ai?",
            "Kể tên kỳ nghỉ hay chuyến đi chơi tệ/vui nhất mà bạn từng trải qua cùng đồng nghiệp!",
            "Nếu được dùng một món ăn để mô tả tính cách của mình, bạn chọn món ăn nào?",
          ]
        };
        const selectedList = fallbacks[category] || fallbacks.icebreaker;
        // Shuffle slightly to feel dynamic
        const shuffledList = [...selectedList].sort(() => Math.random() - 0.5);
        return res.json({ prompts: shuffledList, warning: "Chưa cấu hình GEMINI_API_KEY. Đang sử dụng câu hỏi mẫu có sẵn." });
      }

      const systemInstruction = `Bạn là quản trò (Game Master) teambuilding duyên dáng, sáng tạo và mặn mà.
Nhiệm vụ: Viết các câu hỏi/thách đố tiếng Việt vô cùng sáng tạo, vui nhộn, tạo sự gắn kết mạnh mẽ và hoàn toàn phù hợp với môi trường tập thể doanh nghiệp hoặc bạn bè (không thô tục, bậy bạ, phản cảm).
Ngôn ngữ phản hồi: Toàn bộ các câu hỏi/thử thách do bạn tạo ra phải bằng Tiếng Việt sinh động, thú vị, thu hút.`;

      const prompt = `Hãy tạo 6 câu hỏi hoặc thử thách thuộc thể loại: "${typeLabel}".
${topicText}
${contextText}
Yêu cầu nội dung: Vui vẻ, gắn kết, kích thích tương tác và giao tiếp vui nhộn giữa các đồng nghiệp hoặc bạn bè. Hãy viết thật tự nhiên và thú vị.

Hãy trả về kết quả dưới định dạng JSON gồm thuộc tính "prompts" là một mảng chứa 6 chuỗi câu hỏi/thử thách tiếng Việt độc đáo.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["prompts"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultObj = JSON.parse(responseText.trim());
      res.json({ prompts: resultObj.prompts || [] });

    } catch (error: any) {
      console.error("Lỗi API tạo thử thách:", error);
      res.status(500).json({ error: error.message || "Đã xảy ra lỗi khi tạo thử thách." });
    }
  });

  // Endpoint to generate quick funny penalties for lucky draws
  app.post("/api/gemini/penalty", async (req, res) => {
    try {
      const { intensity, userContext } = req.body;
      const range = intensity || "funny";

      let ai;
      try {
        ai = getGeminiClient();
      } catch (err) {
        // Fallback list of funny penalties
        const fallbacks = [
          "Bắt chước âm thanh của 3 con vật khác nhau thật sinh động trong 15 giây!",
          "Múa quạt hoặc nhảy 1 điệu nhảy ngắn hot trend ngay tại chỗ!",
          "Nói câu líu lưỡi 'Nồi đồng nấu ốc nồi đất nấu ếch' thật nhanh 5 lần liên tiếp!",
          "Làm biểu cảm gương mặt xấu xí nhất hoặc đáng yêu nhất để mọi người chụp ảnh!",
          "Hãy chịu trách nhiệm rót nước phục vụ cho 3 người bên cạnh trong suốt buổi trò chơi!",
          "Đứng dậy và cúi chào trịnh trọng các thành viên khác theo phong cách hoàng gia!",
        ];
        const randomPenalty = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        return res.json({ penalty: randomPenalty, warning: "Chưa cấu hình GEMINI_API_KEY. Đang dùng hình phạt ngẫu nhiên mẫu." });
      }

      const prompt = `Hãy gợi ý 1 hình phạt (penalty) teambuilding siêu ngắn gọn, hài hước và dễ thương cho một thành viên không may mắn (hoặc trúng thưởng ngẫu nhiên).
Mức độ bá đạo: "${range}" (gentle = nhẹ nhàng vui vẻ, funny = hài hước dí dỏm, crazy = lầy lội cực bốc).
${userContext ? `Bối cảnh sự kiện: ${userContext}.` : ""}

Bạn hãy trả về kết quả dưới định dạng JSON gồm các trường:
- penalty: Một hình phạt cụ thể, vui vẻ, thực hiện ngay được bằng Tiếng Việt.
- duration: Thời gian hoặc giới hạn số lần thực hiện (ví dụ: "trong 30 giây", "3 lần liên tiếp").`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Bạn là một quản trò chuyên nghiệp và cực kỳ tấu hài.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              penalty: { type: Type.STRING },
              duration: { type: Type.STRING }
            },
            required: ["penalty"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultObj = JSON.parse(responseText.trim());
      res.json(resultObj);

    } catch (error: any) {
      console.error("Lỗi API tạo hình phạt:", error);
      res.status(500).json({ error: error.message || "Đã xảy ra lỗi khi tạo hình phạt." });
    }
  });

  // Endpoint to proxy URL fetching for importing rosters
  app.post("/api/fetch-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "Không tìm thấy URL." });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Lỗi tải xuống: ${response.statusText}`);
      }
      
      const text = await response.text();
      res.send(text);
    } catch (error: any) {
      console.error("Lỗi API fetch URL:", error);
      res.status(500).json({ error: error.message || "Đã xảy ra lỗi khi tải URL." });
    }
  });

  // Support for development static server or Vite Dev Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
