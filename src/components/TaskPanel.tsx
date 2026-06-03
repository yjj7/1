import { type TaskCategory } from '../types';
import { useT } from '../i18n';

interface TaskPanelProps {
  tasks: { id: string; text: string; completed: boolean; category: TaskCategory }[];
  newTaskText: string;
  setNewTaskText: (v: string) => void;
  taskCategory: TaskCategory;
  setTaskCategory: (c: TaskCategory) => void;
  addTask: () => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  dragIdx: number | null;
  onDragStart: (idx: number) => void;
  onDragOver: (e: React.DragEvent, idx: number) => void;
  onDragEnd: () => void;
}

const catColors: Record<TaskCategory, string> = {
  study: 'text-blue-400',
  work: 'text-amber-400',
  exercise: 'text-green-400',
  other: 'text-purple-400',
};

export function TaskPanel({
  tasks, newTaskText, setNewTaskText, taskCategory, setTaskCategory,
  addTask, toggleTask, removeTask, dragIdx, onDragStart, onDragOver, onDragEnd,
}: TaskPanelProps) {
  const { t } = useT();
  const catLabels: Record<TaskCategory, string> = {
    study: t('study'), work: t('work'), exercise: t('exercise'), other: t('other'),
  };

  return (
    <div className="pointer-events-auto absolute left-8 top-32 md:left-24 md:top-40 w-64 max-h-[50vh] overflow-y-auto p-4 rounded-2xl bg-white/[0.01] backdrop-blur-sm border border-white/10">
      <h3 className="text-xs font-medium text-white/50 mb-3">
        {t('tasks')} ({tasks.filter((t) => t.completed).length}/{tasks.length})
      </h3>
      <div className="flex space-x-1 mb-3">
        {(['study', 'work', 'exercise', 'other'] as TaskCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setTaskCategory(c)}
            className={`flex-1 py-1 rounded text-[10px] transition-colors ${taskCategory === c ? 'bg-white/15 text-white' : 'bg-white/[0.03] text-white/40 hover:text-white/60'}`}
          >
            {catLabels[c]}
          </button>
        ))}
      </div>
      <div className="flex space-x-2 mb-4">
        <input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
          placeholder={t('addTask')}
          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none placeholder:text-white/20"
        />
        <button onClick={addTask} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs">+</button>
      </div>
      <ul className="space-y-1.5">
        {tasks.map((tk, idx) => (
          <li
            key={tk.id}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
            className={`flex items-center space-x-2 p-1.5 rounded-lg transition-colors ${dragIdx === idx ? 'bg-white/10' : 'hover:bg-white/[0.02]'} cursor-grab active:cursor-grabbing`}
          >
            <span className="w-3 h-3 text-white/15 flex-shrink-0">⠿</span>
            <span className={`text-[9px] w-8 ${catColors[tk.category]}`}>{catLabels[tk.category]}</span>
            <button
              onClick={() => toggleTask(tk.id)}
              className={`w-4 h-4 rounded border flex-shrink-0 ${tk.completed ? 'bg-green-500 border-green-500 flex items-center justify-center' : 'border-white/20 hover:border-white/40'}`}
            >
              {tk.completed && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <span className={`text-xs flex-1 truncate ${tk.completed ? 'line-through text-white/25' : 'text-white/70'}`}>{tk.text}</span>
            <button onClick={() => removeTask(tk.id)} className="text-white/15 hover:text-red-400 transition-colors flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
