import AgentRobotAvatar, {
  VERSION,
  type AgentRobotAvatarAction,
  type AgentRobotAvatarActionPhase,
  type AgentRobotAvatarActionSource,
  type AgentRobotAvatarActionStateDetail,
  type AgentRobotAvatarCanonicalAction,
  type AgentRobotAvatarMotion,
  type AgentRobotAvatarState,
  type AgentRobotAvatarWakeOn,
} from '@ai-calypse/avatar-studio';

const avatar = new AgentRobotAvatar();
const action: AgentRobotAvatarAction = 'success';
const wakeOn: AgentRobotAvatarWakeOn = 'interaction';
const motion: AgentRobotAvatarMotion = 'reduce';

void avatar.play(action);
void avatar.startWaiting();
void avatar.startWaiting({ variant: 'wrap' });
void avatar.play('waiting-wrap');
void avatar.play('love');
const loveState: AgentRobotAvatarState = 'love';
const loveCanonical: AgentRobotAvatarCanonicalAction = 'love';
void avatar.play('random');
void avatar.play('slot');
const randomState: AgentRobotAvatarState = 'random';
const randomCanonical: AgentRobotAvatarCanonicalAction = 'random';
void loveState;
void loveCanonical;
void randomState;
void randomCanonical;
void avatar.sleep();
void avatar.wake();
void avatar.input();
void avatar.input(false);
avatar
  .stopWaiting()
  .setPointerFollow(false)
  .setAntennaFlash(true)
  .setHeadRoundness(50)
  .reset();

const roundness: number = avatar.getHeadRoundness();
const version: string = VERSION;
const element: AgentRobotAvatar = document.createElement('agent-robot-avatar');

avatar.addEventListener('face-state', event => {
  const state: AgentRobotAvatarState = event.detail.state;
  void state;
});

avatar.addEventListener('action-state', event => {
  const detail: AgentRobotAvatarActionStateDetail = event.detail;
  const canonical: AgentRobotAvatarCanonicalAction = detail.action;
  const phase: AgentRobotAvatarActionPhase = detail.phase;
  const source: AgentRobotAvatarActionSource = detail.source;
  void canonical;
  void phase;
  void source;
});

avatar.addEventListener('head-roundness-change', event => {
  const value: number = event.detail.value;
  const eventVersion: string = event.detail.version;
  void value;
  void eventVersion;
});

// @ts-expect-error Unknown actions must be rejected by TypeScript.
avatar.play('not-a-real-action');
// @ts-expect-error Wake policy values are a closed set.
const invalidWakeOn: AgentRobotAvatarWakeOn = 'always';
// @ts-expect-error Motion policy values are a closed set.
const invalidMotion: AgentRobotAvatarMotion = 'minimal';

void roundness;
void version;
void element;
void wakeOn;
void motion;
void invalidWakeOn;
void invalidMotion;

import { customizeAvatar, exportAvatarSVG, accessories } from "@ai-calypse/avatar-studio";
const appearance = customizeAvatar(avatar, { accessory: "headphones", matchEyes: true, eyes: "#dbf59d" });
const svg: string = exportAvatarSVG(avatar, 256);
void appearance; void svg; void accessories;
// @ts-expect-error Only supported accessory IDs are allowed.
customizeAvatar(avatar, { accessory: "unknown" });

customizeAvatar(avatar, { bodyShape: 'random', shapeSeed: 42 });
avatar.setBodyShape('random', 42).setHeadRoundness(70);
const shapeMode: 'classic' | 'random' = avatar.getBodyShape();
const shapeSeed: number = avatar.getShapeSeed();
void shapeMode; void shapeSeed;
// @ts-expect-error Unsupported body shapes must be rejected.
customizeAvatar(avatar, { bodyShape: 'triangle' });

import { configureAvatar, exportAvatar, avatarActions } from '@ai-calypse/avatar-studio';
configureAvatar(avatar, {appearance:{antenna:false,bodyShape:'random',shapeSeed:42},behavior:{antennaFlash:true,loop:true,pointerFollow:false,motion:'reduce',wakeOn:'manual',autoSleep:5000},action:'love'});
const exported: Promise<Blob> = exportAvatar(avatar,{format:'gif',size:128,frames:12,delay:100});
const actions: readonly AgentRobotAvatarAction[] = avatarActions;
void exported; void actions;
// @ts-expect-error Invalid movement policy.
configureAvatar(avatar,{behavior:{motion:'fast'}});
