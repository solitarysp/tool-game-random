/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = "wheel" | "jar" | "teams" | "challenges";

export interface Participant {
  id: string;
  name: string;
}

export interface TeamResult {
  teamName: string;
  slogan: string;
  emoji: string;
  members: string[];
  captain?: string;
}

export interface ChallengeCategory {
  id: "truth" | "dare" | "icebreaker";
  label: string;
  description: string;
  color: string;
}

export interface WheelOption {
  id: string;
  text: string;
  color: string;
}
