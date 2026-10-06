export type AgentRobotAvatarAction =
  | 'idle'
  | 'bored'
  | 'waiting'
  | 'wait'
  | 'waiting-wrap'
  | 'input'
  | 'send'
  | 'success'
  | 'failure'
  | 'failed'
  | 'fail'
  | 'warning'
  | 'inspect'
  | 'verify'
  | 'review'
  | 'angry'
  | 'blocked'
  | 'policy-blocked'
  | 'error'
  | 'system-error'
  | 'connection-error'
  | 'surprise'
  | 'love'
  | 'random'
  | 'slot'
  | 'sleep'
  | 'wake';

export type AgentRobotAvatarState =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'sleepy'
  | 'input'
  | 'sleep'
  | 'surprise'
  | 'love'
  | 'random'
  | 'waiting'
  | 'warning'
  | 'error'
  | 'inspect'
  | 'failure'
  | 'squeeze'
  | 'antenna-drag';

export type AgentRobotAvatarCanonicalAction =
  | 'idle'
  | 'bored'
  | 'waiting'
  | 'input'
  | 'send'
  | 'success'
  | 'failure'
  | 'warning'
  | 'inspect'
  | 'angry'
  | 'blocked'
  | 'error'
  | 'surprise'
  | 'love'
  | 'random'
  | 'sleep'
  | 'wake'
  | 'reaction'
  | 'squeeze'
  | 'antenna-drag';

export type AgentRobotAvatarActionPhase = 'start' | 'end' | 'cancel';
export type AgentRobotAvatarActionSource = 'api' | 'interaction' | 'automatic';
export type AgentRobotAvatarWakeOn = 'activity' | 'interaction' | 'manual';
export type AgentRobotAvatarMotion = 'auto' | 'reduce' | 'full';
export interface AgentRobotAvatarWaitingOptions {
  variant?: 'default' | 'wrap';
}

export interface AgentRobotAvatarActionStateDetail {
  action: AgentRobotAvatarCanonicalAction;
  phase: AgentRobotAvatarActionPhase;
  source: AgentRobotAvatarActionSource;
}

export interface AgentRobotAvatarEventMap extends HTMLElementEventMap {
  'face-state': CustomEvent<{ state: AgentRobotAvatarState }>;
  'action-state': CustomEvent<AgentRobotAvatarActionStateDetail>;
  'head-roundness-change': CustomEvent<{ value: number; version: string }>;
}

export declare class AgentRobotAvatar extends HTMLElement {
  play(action: AgentRobotAvatarAction): this | Promise<void>;
  reset(): this;
  sleep(): this | Promise<void>;
  wake(): this | Promise<void>;
  input(active?: boolean): this | Promise<void>;
  startWaiting(options?: AgentRobotAvatarWaitingOptions): Promise<this>;
  stopWaiting(): this;
  setPointerFollow(enabled?: boolean): this;
  setAntennaFlash(enabled?: boolean): this;
  setPressSqueeze(enabled?: boolean): this;
  setAntennaDrag(enabled?: boolean): this;
  setHeadRoundness(value?: number): this;
  getHeadRoundness(): number;
  noteActivity(wake?: boolean): void;

  addEventListener<K extends keyof AgentRobotAvatarEventMap>(
    type: K,
    listener: (this: AgentRobotAvatar, event: AgentRobotAvatarEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener<K extends keyof AgentRobotAvatarEventMap>(
    type: K,
    listener: (this: AgentRobotAvatar, event: AgentRobotAvatarEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void;
}

export declare const VERSION: string;
export declare class AgentCatAvatar extends AgentRobotAvatar {}

export default AgentRobotAvatar;

declare global {
  interface HTMLElementTagNameMap {
    'agent-robot-avatar': AgentRobotAvatar;
    'agent-cat-avatar': AgentCatAvatar;
  }
}

export type AvatarAccessory = 'none' | 'glasses' | 'headphones' | 'bow' | 'sunglasses' | 'crown' | 'party' | 'halo' | 'beanie' | 'moustache' | 'flower' | 'round-glasses' | 'square-glasses' | 'cat-eye' | 'aviators' | 'heart-glasses' | 'star-glasses' | 'monocle' | 'goggles' | 'visor' | 'eye-patch' | 'top-hat' | 'fedora' | 'cowboy' | 'cap' | 'beret' | 'bucket' | 'wizard' | 'santa' | 'chef' | 'graduation' | 'pirate' | 'cat-ears' | 'bunny-ears' | 'bear-ears' | 'fox-ears' | 'horns' | 'antlers' | 'alien-antennae' | 'scarf' | 'tie' | 'necklace' | 'medal' | 'choker' | 'bandana' | 'star-pin' | 'heart-pin' | 'lightning-pin' | 'leaf-pin' | 'snowflake-pin' | 'butterfly-pin';

export interface AvatarAppearance {
  body?: string;
  eyes?: string;
  accessoryColor?: string;
  matchEyes?: boolean;
  eyeSize?: number;
  spacing?: number;
  headRoundness?: number;
  accessory?: AvatarAccessory;
}

export declare function customizeAvatar(avatar: AgentRobotAvatar, appearance?: AvatarAppearance): Readonly<Required<AvatarAppearance>>;
export declare function exportAvatarSVG(avatar: AgentRobotAvatar, size?: number): string;
export declare const accessories: readonly Readonly<{ id: Exclude<AvatarAccessory, "none">; name: string; category: string }>[];
