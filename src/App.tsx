import React, { useState, useEffect } from "react";
import { AppState, Task, InfoDocId } from "./types";
import { LandingPage } from "./components/LandingPage";
import { SetupPage } from "./components/SetupPage";
import { TimerPage } from "./components/TimerPage";
import { InfoPage } from "./components/InfoPage";
import { SCENES, DURATIONS, MUSIC_TRACKS } from "./data";
import { audioManager } from "./audioManager";

export default function App() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [activeDocId, setActiveDocId] = useState<InfoDocId>("guide");

  const savedState = (() => {
    try {
      return JSON.parse(localStorage.getItem("studyWithMeState") || "{}");
    } catch {
      return {};
    }
  })();

  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    savedState.selectedSceneId || SCENES[0].id,
  );
  const [selectedMusicId, setSelectedMusicId] = useState<string>(
    savedState.selectedMusicId || MUSIC_TRACKS[0].id,
  );
  const [musicVolume, setMusicVolume] = useState<number>(
    savedState.musicVolume ?? 50,
  );
  const [bgVolume, setBgVolume] = useState<number>(savedState.bgVolume ?? 30);
  const [timerDuration, setTimerDuration] = useState<number>(
    savedState.timerDuration ?? DURATIONS[1],
  );
  const [tasks, setTasks] = useState<Task[]>(savedState.tasks ?? []);
  const [pomodoroCount, setPomodoroCount] = useState<number>(
    savedState.pomodoroCount ?? 0,
  );

  useEffect(() => {
    localStorage.setItem(
      "studyWithMeState",
      JSON.stringify({
        selectedSceneId,
        selectedMusicId,
        musicVolume,
        bgVolume,
        timerDuration,
        tasks,
        pomodoroCount,
      }),
    );
  }, [
    selectedSceneId,
    selectedMusicId,
    musicVolume,
    bgVolume,
    timerDuration,
    tasks,
    pomodoroCount,
  ]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/30">
      {appState === "landing" && (
        <LandingPage
          onStart={() => {
            setAppState("setup");
          }}
          onNavigate={(docId) => {
            setActiveDocId(docId);
            setAppState("info");
          }}
        />
      )}

      {appState === "setup" && (
        <SetupPage
          selectedSceneId={selectedSceneId}
          onSelectScene={setSelectedSceneId}
          selectedMusicId={selectedMusicId}
          onSelectMusic={setSelectedMusicId}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          bgVolume={bgVolume}
          onBgVolumeChange={setBgVolume}
          timerDuration={timerDuration}
          onTimerDurationChange={setTimerDuration}
          onEnter={() => {
            audioManager.init();
            const musicTrack = MUSIC_TRACKS.find(
              (m) => m.id === selectedMusicId,
            );
            if (musicTrack) audioManager.setMusic(musicTrack.audioUrl);
            const scene = SCENES.find((s) => s.id === selectedSceneId);
            if (scene && scene.audioUrl) audioManager.setBg(scene.audioUrl);
            audioManager.setMusicVolume(musicVolume / 100);
            audioManager.setBgVolume(bgVolume / 100);
            audioManager.play();
            setAppState("timer");
          }}
          onBack={() => setAppState("landing")}
        />
      )}

      {appState === "timer" && (
        <TimerPage
          sceneId={selectedSceneId}
          musicId={selectedMusicId}
          onSelectMusic={setSelectedMusicId}
          durationMinutes={timerDuration}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          bgVolume={bgVolume}
          onBgVolumeChange={setBgVolume}
          onExit={() => {
            audioManager.stop();
            setAppState("landing");
          }}
          tasks={tasks}
          onTasksChange={setTasks}
          pomodoroCount={pomodoroCount}
          onPomodoroComplete={() => setPomodoroCount((prev) => prev + 1)}
        />
      )}

      {appState === "info" && (
        <InfoPage docId={activeDocId} onClose={() => setAppState("landing")} />
      )}
    </div>
  );
}
