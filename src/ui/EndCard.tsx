import {
  CircleCheck,
  CircleX,
  Clock3,
  Heart,
  RotateCcw,
  Siren,
  Sparkles,
} from "lucide-react";
import { pickEnding } from "../ride/endings";
import { format } from "../story/clock";
import type { Tasks } from "../story/state";
import { newSeed, useStory } from "../story/store";
import { S } from "../strings";
import { money } from "./phone/apps";

const TASK_KEYS: (keyof Tasks)[] = [
  "brushed",
  "washed",
  "keys",
  "dressed",
  "texted",
  "helmets",
];

// Thẻ kết thúc: ngủ quên, hoặc tới công ty (kết thúc theo pickEnding).
export function EndCard() {
  const s = useStory((st) => st.s);
  const dispatch = useStory((st) => st.dispatch);
  const arrived = s.phase === "street" && s.stage === "done";
  if (s.phase !== "overslept" && !arrived) return null;
  const ending = pickEnding(s);
  const copy = S.endings[ending.id];
  const restart = () => dispatch({ type: "restart", seed: newSeed() });
  const good = ending.id === "perfect" || ending.id === "ok";
  return (
    <div className="overlay-backdrop">
      <div className={good ? "card end-card good" : "card end-card bad"}>
        <div className="end-main">
          <h2>{copy.title}</h2>
          {arrived && (
            <p className="end-arrived">
              <Clock3 aria-hidden /> {S.endings.arrived}{" "}
              <span className="end-time">{format(s.minutes)}</span>
            </p>
          )}
          <p>{copy.body}</p>
          {ending.emText && (
            <div className="end-bubble">
              <span className="end-bubble-name">{S.chat.contact}</span>
              <span>{S.endings.emText}</span>
            </div>
          )}
          {ending.also.map((id) => (
            <p key={id} className="end-also">
              + {S.endings[id].title}
            </p>
          ))}
        </div>
        <div className="end-side">
          {arrived && (
            <>
              <div className="stats">
                <div>
                  <Sparkles aria-hidden /> {S.end.hygiene}{" "}
                  <strong>{Math.round(s.hygiene)}</strong>
                </div>
                <div>
                  <Heart aria-hidden /> {S.end.mood}{" "}
                  <strong>{Math.round(s.mood)}</strong>
                </div>
                {s.fines > 0 && (
                  <div className="fine">
                    <Siren aria-hidden /> {S.endings.fines}{" "}
                    <strong>{money(s.fines)}</strong>
                  </div>
                )}
              </div>
              <ul className="end-tasks">
                {TASK_KEYS.map((k) => {
                  const done =
                    k === "helmets"
                      ? s.tasks.helmets === 2
                      : s.tasks[k] === true;
                  return (
                    <li key={k} className={done ? "done" : ""}>
                      {done ? (
                        <CircleCheck aria-hidden />
                      ) : (
                        <CircleX aria-hidden />
                      )}
                      {S.tasks[k]}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <button className="btn btn-primary btn-block" onClick={restart}>
            <RotateCcw aria-hidden /> {S.end.restart}
          </button>
        </div>
      </div>
    </div>
  );
}
