use gpui::{KeyDownEvent, SharedString};
use time::{
    format_description::well_known::Rfc3339, macros::format_description, OffsetDateTime,
    PrimitiveDateTime,
};

use crate::domain::{AppSettings, Deadline, DeadlineKind, Priority, Task, TaskDraft, TaskType};

const SIMPLE_DEADLINE_FORMAT: &[time::format_description::FormatItem<'static>] =
    format_description!("[year]-[month]-[day] [hour]:[minute]");

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AppScreen {
    Tasks,
    Schedule,
    Analytics,
    Planner,
    History,
}

impl AppScreen {
    pub const fn all() -> [Self; 5] {
        [
            Self::Tasks,
            Self::Schedule,
            Self::Analytics,
            Self::Planner,
            Self::History,
        ]
    }

    pub const fn label(self) -> &'static str {
        match self {
            Self::Tasks => "Tasks",
            Self::Schedule => "Schedule",
            Self::Analytics => "Analytics",
            Self::Planner => "Planner",
            Self::History => "History",
        }
    }

    pub const fn summary(self) -> &'static str {
        match self {
            Self::Tasks => "Create, edit, filter, and review your task backlog.",
            Self::Schedule => {
                "Schedule generation and explanations will live here in later phases."
            }
            Self::Analytics => "Metrics, ML insights, and usage trends will be surfaced here.",
            Self::Planner => "The multi-day workload view and risk alerts will arrive here.",
            Self::History => "Completed schedules and outcome review will be available here.",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TaskFilter {
    Incomplete,
    Completed,
    DeadlineTagged,
}

impl TaskFilter {
    pub const fn all() -> [Self; 3] {
        [Self::Incomplete, Self::Completed, Self::DeadlineTagged]
    }

    pub const fn label(self) -> &'static str {
        match self {
            Self::Incomplete => "Incomplete",
            Self::Completed => "Completed",
            Self::DeadlineTagged => "Deadline Tagged",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TaskFormField {
    Title,
    DurationMinutes,
    Deadline,
    Notes,
}

impl TaskFormField {
    pub const fn label(self) -> &'static str {
        match self {
            Self::Title => "Title",
            Self::DurationMinutes => "Duration (minutes)",
            Self::Deadline => "Deadline",
            Self::Notes => "Notes",
        }
    }

    pub const fn helper(self) -> &'static str {
        match self {
            Self::Title => "Describe the task in plain language.",
            Self::DurationMinutes => "Numbers only. Example: 45",
            Self::Deadline => {
                "Optional. Use `YYYY-MM-DD HH:MM` or RFC3339; UTC is assumed for plain dates."
            }
            Self::Notes => "Optional planning detail.",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TaskEditorState {
    pub title: String,
    pub duration_minutes: String,
    pub deadline: String,
    pub notes: String,
    pub priority: Priority,
    pub task_type: TaskType,
    pub deadline_kind: DeadlineKind,
    pub editing_task_id: Option<u64>,
    pub active_field: TaskFormField,
}

impl Default for TaskEditorState {
    fn default() -> Self {
        Self {
            title: String::new(),
            duration_minutes: "30".into(),
            deadline: String::new(),
            notes: String::new(),
            priority: Priority::Medium,
            task_type: TaskType::Study,
            deadline_kind: DeadlineKind::Soft,
            editing_task_id: None,
            active_field: TaskFormField::Title,
        }
    }
}

impl TaskEditorState {
    pub fn clear(&mut self) {
        *self = Self::default();
    }

    pub fn field_value_mut(&mut self, field: TaskFormField) -> &mut String {
        match field {
            TaskFormField::Title => &mut self.title,
            TaskFormField::DurationMinutes => &mut self.duration_minutes,
            TaskFormField::Deadline => &mut self.deadline,
            TaskFormField::Notes => &mut self.notes,
        }
    }

    pub const fn placeholder(field: TaskFormField) -> &'static str {
        match field {
            TaskFormField::Title => "Revise mechanics paper",
            TaskFormField::DurationMinutes => "45",
            TaskFormField::Deadline => "2026-04-16 18:00",
            TaskFormField::Notes => "Focus on the highest-friction part first",
        }
    }

    fn cycle_field(&mut self) {
        self.active_field = match self.active_field {
            TaskFormField::Title => TaskFormField::DurationMinutes,
            TaskFormField::DurationMinutes => TaskFormField::Deadline,
            TaskFormField::Deadline => TaskFormField::Notes,
            TaskFormField::Notes => TaskFormField::Title,
        };
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TaskRecord {
    pub id: u64,
    pub task: Task,
    pub completed: bool,
}

impl TaskRecord {
    pub fn matches_filter(&self, filter: TaskFilter) -> bool {
        match filter {
            TaskFilter::Incomplete => !self.completed,
            TaskFilter::Completed => self.completed,
            TaskFilter::DeadlineTagged => self.task.deadline().is_some(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub active_screen: AppScreen,
    pub status_line: SharedString,
    pub settings: AppSettings,
    pub filter: TaskFilter,
    pub editor: TaskEditorState,
    pub tasks: Vec<TaskRecord>,
    next_task_id: u64,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            active_screen: AppScreen::Tasks,
            status_line:
                "Phase 3: build tasks manually, press Enter to save, Tab to move between fields."
                    .into(),
            settings: AppSettings::default(),
            filter: TaskFilter::Incomplete,
            editor: TaskEditorState::default(),
            tasks: Vec::new(),
            next_task_id: 1,
        }
    }
}

impl AppState {
    pub fn select_screen(&mut self, screen: AppScreen) {
        self.active_screen = screen;
        self.status_line = match screen {
            AppScreen::Tasks => {
                "Tasks screen ready. Click a field to edit it, and use the action chips to manage tasks."
                    .into()
            }
            _ => {
                format!("{} is still a placeholder for a later roadmap phase.", screen.label())
                    .into()
            }
        };
    }

    pub fn set_filter(&mut self, filter: TaskFilter) {
        self.filter = filter;
        self.status_line = format!("Showing {} tasks.", filter.label().to_lowercase()).into();
    }

    pub fn visible_tasks(&self) -> impl Iterator<Item = &TaskRecord> {
        self.tasks
            .iter()
            .filter(move |task| task.matches_filter(self.filter))
    }

    pub fn visible_task_count(&self) -> usize {
        self.visible_tasks().count()
    }

    pub fn select_field(&mut self, field: TaskFormField) {
        self.editor.active_field = field;
        self.status_line = format!("Editing {}.", field.label().to_lowercase()).into();
    }

    pub fn cycle_priority(&mut self) {
        self.editor.priority = match self.editor.priority {
            Priority::Low => Priority::Medium,
            Priority::Medium => Priority::High,
            Priority::High => Priority::Critical,
            Priority::Critical => Priority::Low,
        };
        self.status_line = format!("Priority set to {:?}.", self.editor.priority).into();
    }

    pub fn cycle_task_type(&mut self) {
        self.editor.task_type = match self.editor.task_type {
            TaskType::Study => TaskType::Coding,
            TaskType::Coding => TaskType::Admin,
            TaskType::Admin => TaskType::Personal,
            TaskType::Personal => TaskType::Study,
        };
        self.status_line = format!("Task type set to {:?}.", self.editor.task_type).into();
    }

    pub fn cycle_deadline_kind(&mut self) {
        self.editor.deadline_kind = match self.editor.deadline_kind {
            DeadlineKind::Soft => DeadlineKind::Hard,
            DeadlineKind::Hard => DeadlineKind::Soft,
        };
        self.status_line = format!("Deadline kind set to {:?}.", self.editor.deadline_kind).into();
    }

    pub fn clear_editor(&mut self) {
        self.editor.clear();
        self.status_line = "Task editor cleared.".into();
    }

    pub fn start_editing(&mut self, task_id: u64) {
        if let Some(record) = self.tasks.iter().find(|record| record.id == task_id) {
            self.editor.title = record.task.title().to_owned();
            self.editor.duration_minutes = record.task.duration_minutes().to_string();
            self.editor.deadline = record
                .task
                .deadline()
                .map(|deadline| {
                    deadline
                        .due_at
                        .format(SIMPLE_DEADLINE_FORMAT)
                        .unwrap_or_default()
                })
                .unwrap_or_default();
            self.editor.notes = record.task.notes().unwrap_or_default().to_owned();
            self.editor.priority = record.task.priority();
            self.editor.task_type = record.task.task_type();
            self.editor.deadline_kind = record
                .task
                .deadline()
                .map(|deadline| deadline.kind)
                .unwrap_or(DeadlineKind::Soft);
            self.editor.editing_task_id = Some(task_id);
            self.editor.active_field = TaskFormField::Title;
            self.status_line = format!("Editing task '{}'.", record.task.title()).into();
        }
    }

    pub fn delete_task(&mut self, task_id: u64) {
        let original_len = self.tasks.len();
        self.tasks.retain(|record| record.id != task_id);

        if self.tasks.len() < original_len {
            if self.editor.editing_task_id == Some(task_id) {
                self.editor.clear();
            }
            self.status_line = "Task deleted.".into();
        }
    }

    pub fn toggle_completed(&mut self, task_id: u64) {
        if let Some(record) = self.tasks.iter_mut().find(|record| record.id == task_id) {
            record.completed = !record.completed;
            self.status_line = if record.completed {
                format!("Marked '{}' complete.", record.task.title()).into()
            } else {
                format!("Marked '{}' incomplete.", record.task.title()).into()
            };
        }
    }

    pub fn submit_editor(&mut self) {
        let duration_minutes = match self.editor.duration_minutes.trim().parse::<u32>() {
            Ok(value) => value,
            Err(_) => {
                self.status_line = "Duration must be a whole number of minutes.".into();
                return;
            }
        };

        let deadline = match parse_deadline(self.editor.deadline.trim(), self.editor.deadline_kind)
        {
            Ok(value) => value,
            Err(message) => {
                self.status_line = message.into();
                return;
            }
        };

        let draft = TaskDraft {
            title: self.editor.title.clone(),
            duration_minutes,
            priority: self.editor.priority,
            task_type: self.editor.task_type,
            deadline,
            notes: if self.editor.notes.trim().is_empty() {
                None
            } else {
                Some(self.editor.notes.clone())
            },
        };

        let task = match Task::from_draft(draft) {
            Ok(task) => task,
            Err(error) => {
                self.status_line = format!("Task validation failed: {error}").into();
                return;
            }
        };

        match self.editor.editing_task_id {
            Some(task_id) => {
                if let Some(record) = self.tasks.iter_mut().find(|record| record.id == task_id) {
                    let title = task.title().to_owned();
                    record.task = task;
                    self.status_line = format!("Updated task '{}'.", title).into();
                }
            }
            None => {
                let task_id = self.next_task_id;
                self.next_task_id += 1;
                let title = task.title().to_owned();
                self.tasks.push(TaskRecord {
                    id: task_id,
                    task,
                    completed: false,
                });
                self.status_line = format!("Added task '{}'.", title).into();
            }
        }

        self.editor.clear();
    }

    pub fn handle_task_keydown(&mut self, event: &KeyDownEvent) -> bool {
        if self.active_screen != AppScreen::Tasks {
            return false;
        }

        if event.keystroke.modifiers.control
            || event.keystroke.modifiers.alt
            || event.keystroke.modifiers.platform
            || event.keystroke.modifiers.function
        {
            return false;
        }

        match event.keystroke.key.as_str() {
            "tab" => {
                self.editor.cycle_field();
                self.status_line = format!(
                    "Moved focus to {}.",
                    self.editor.active_field.label().to_lowercase()
                )
                .into();
                true
            }
            "backspace" => {
                self.editor.field_value_mut(self.editor.active_field).pop();
                true
            }
            "enter" => {
                self.submit_editor();
                true
            }
            "escape" => {
                self.clear_editor();
                true
            }
            _ => match extract_typed_text(event) {
                Some(fragment) => {
                    self.push_fragment(fragment);
                    true
                }
                None => false,
            },
        }
    }

    fn push_fragment(&mut self, fragment: String) {
        let field = self.editor.active_field;
        let buffer = self.editor.field_value_mut(field);

        match field {
            TaskFormField::DurationMinutes => {
                if fragment.chars().all(|character| character.is_ascii_digit()) {
                    buffer.push_str(&fragment);
                }
            }
            TaskFormField::Deadline => {
                if fragment.chars().all(|character| {
                    character.is_ascii_alphanumeric()
                        || matches!(character, '-' | ':' | ' ' | 'T' | 'Z' | '+' | '.')
                }) {
                    buffer.push_str(&fragment);
                }
            }
            TaskFormField::Title | TaskFormField::Notes => buffer.push_str(&fragment),
        }
    }
}

fn extract_typed_text(event: &KeyDownEvent) -> Option<String> {
    if let Some(character) = event.keystroke.key_char.as_ref() {
        if !character.chars().any(char::is_control) {
            return Some(character.clone());
        }
    }

    match event.keystroke.key.as_str() {
        "space" => Some(" ".into()),
        key if key.len() == 1 => Some(key.to_owned()),
        _ => None,
    }
}

fn parse_deadline(input: &str, deadline_kind: DeadlineKind) -> Result<Option<Deadline>, String> {
    if input.is_empty() {
        return Ok(None);
    }

    if let Ok(parsed) = OffsetDateTime::parse(input, &Rfc3339) {
        return Ok(Some(Deadline::new(parsed, deadline_kind)));
    }

    if let Ok(parsed) = PrimitiveDateTime::parse(input, SIMPLE_DEADLINE_FORMAT) {
        return Ok(Some(Deadline::new(parsed.assume_utc(), deadline_kind)));
    }

    Err("Deadline must use `YYYY-MM-DD HH:MM` or RFC3339 format.".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn build_state() -> AppState {
        AppState::default()
    }

    #[test]
    fn submit_editor_adds_task() {
        let mut state = build_state();
        state.editor.title = "Revise mechanics".into();
        state.editor.duration_minutes = "45".into();

        state.submit_editor();

        assert_eq!(state.tasks.len(), 1);
        assert_eq!(state.tasks[0].task.title(), "Revise mechanics");
        assert_eq!(state.editor, TaskEditorState::default());
    }

    #[test]
    fn submit_editor_updates_existing_task_when_editing() {
        let mut state = build_state();
        state.editor.title = "Write outline".into();
        state.editor.duration_minutes = "30".into();
        state.submit_editor();

        let existing_id = state.tasks[0].id;
        state.start_editing(existing_id);
        state.editor.title = "Write essay outline".into();
        state.submit_editor();

        assert_eq!(state.tasks.len(), 1);
        assert_eq!(state.tasks[0].task.title(), "Write essay outline");
    }

    #[test]
    fn toggle_completed_changes_visibility_filter_results() {
        let mut state = build_state();
        state.editor.title = "Coding practice".into();
        state.editor.duration_minutes = "60".into();
        state.submit_editor();

        let task_id = state.tasks[0].id;
        state.toggle_completed(task_id);
        state.set_filter(TaskFilter::Completed);

        assert_eq!(state.visible_task_count(), 1);
        assert!(state.tasks[0].completed);
    }

    #[test]
    fn submit_editor_rejects_invalid_deadline_format() {
        let mut state = build_state();
        state.editor.title = "Read chapter".into();
        state.editor.duration_minutes = "20".into();
        state.editor.deadline = "tomorrow evening".into();

        state.submit_editor();

        assert!(state.tasks.is_empty());
        assert_eq!(
            state.status_line.to_string(),
            "Deadline must use `YYYY-MM-DD HH:MM` or RFC3339 format."
        );
    }

    #[test]
    fn parse_deadline_supports_simple_format() {
        let deadline = parse_deadline("2026-04-20 18:30", DeadlineKind::Hard)
            .expect("simple format should parse")
            .expect("deadline should exist");

        assert_eq!(deadline.kind, DeadlineKind::Hard);
        assert_eq!(deadline.due_at.year(), 2026);
        assert_eq!(deadline.due_at.hour(), 18);
    }

    #[test]
    fn handle_keydown_appends_text_to_active_field() {
        let mut state = build_state();

        let handled = state.handle_task_keydown(&KeyDownEvent {
            keystroke: gpui::Keystroke::parse("a").expect("keystroke should parse"),
            is_held: false,
            prefer_character_input: false,
        });

        assert!(handled);
        assert_eq!(state.editor.title, "a");
    }
}
