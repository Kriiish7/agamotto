use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::domain::validation::DomainValidationError;

const MAX_TITLE_LENGTH: usize = 120;
const MAX_NOTES_LENGTH: usize = 2_000;
const MAX_DURATION_MINUTES: u32 = 24 * 60;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskType {
    Study,
    Coding,
    Admin,
    Personal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

impl Priority {
    pub const fn score(self) -> u8 {
        match self {
            Self::Low => 1,
            Self::Medium => 2,
            Self::High => 3,
            Self::Critical => 4,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeadlineKind {
    Soft,
    Hard,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Deadline {
    pub due_at: OffsetDateTime,
    pub kind: DeadlineKind,
}

impl Deadline {
    pub fn new(due_at: OffsetDateTime, kind: DeadlineKind) -> Self {
        Self { due_at, kind }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Task {
    title: String,
    duration_minutes: u32,
    priority: Priority,
    task_type: TaskType,
    deadline: Option<Deadline>,
    notes: Option<String>,
}

impl Task {
    pub fn from_draft(draft: TaskDraft) -> Result<Self, DomainValidationError> {
        let title = draft.title.trim();
        if title.is_empty() {
            return Err(DomainValidationError::EmptyTaskTitle);
        }

        if title.chars().count() > MAX_TITLE_LENGTH {
            return Err(DomainValidationError::TaskTitleTooLong {
                length: title.chars().count(),
                max: MAX_TITLE_LENGTH,
            });
        }

        if !(1..=MAX_DURATION_MINUTES).contains(&draft.duration_minutes) {
            return Err(DomainValidationError::InvalidTaskDuration {
                minutes: draft.duration_minutes,
                min: 1,
                max: MAX_DURATION_MINUTES,
            });
        }

        let notes = match draft.notes {
            Some(notes) => {
                let trimmed = notes.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    if trimmed.chars().count() > MAX_NOTES_LENGTH {
                        return Err(DomainValidationError::TaskNotesTooLong {
                            length: trimmed.chars().count(),
                            max: MAX_NOTES_LENGTH,
                        });
                    }
                    Some(trimmed.to_owned())
                }
            }
            None => None,
        };

        Ok(Self {
            title: title.to_owned(),
            duration_minutes: draft.duration_minutes,
            priority: draft.priority,
            task_type: draft.task_type,
            deadline: draft.deadline,
            notes,
        })
    }

    pub fn title(&self) -> &str {
        &self.title
    }

    pub const fn duration_minutes(&self) -> u32 {
        self.duration_minutes
    }

    pub const fn priority(&self) -> Priority {
        self.priority
    }

    pub const fn task_type(&self) -> TaskType {
        self.task_type
    }

    pub fn deadline(&self) -> Option<&Deadline> {
        self.deadline.as_ref()
    }

    pub fn notes(&self) -> Option<&str> {
        self.notes.as_deref()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskDraft {
    pub title: String,
    pub duration_minutes: u32,
    pub priority: Priority,
    pub task_type: TaskType,
    pub deadline: Option<Deadline>,
    pub notes: Option<String>,
}

impl Default for TaskDraft {
    fn default() -> Self {
        Self {
            title: String::new(),
            duration_minutes: 30,
            priority: Priority::Medium,
            task_type: TaskType::Study,
            deadline: None,
            notes: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use time::macros::datetime;

    use super::*;

    #[test]
    fn task_from_draft_trims_text_fields() {
        let draft = TaskDraft {
            title: "  Revise mechanics  ".into(),
            duration_minutes: 45,
            priority: Priority::High,
            task_type: TaskType::Study,
            deadline: Some(Deadline::new(
                datetime!(2026-04-20 18:00 UTC),
                DeadlineKind::Hard,
            )),
            notes: Some("  Formula sheet first  ".into()),
        };

        let task = Task::from_draft(draft).expect("valid task draft should build");

        assert_eq!(task.title(), "Revise mechanics");
        assert_eq!(task.notes(), Some("Formula sheet first"));
    }

    #[test]
    fn task_from_draft_rejects_empty_title() {
        let draft = TaskDraft {
            title: "   ".into(),
            ..TaskDraft::default()
        };

        let error = Task::from_draft(draft).expect_err("empty title should fail validation");

        assert_eq!(error, DomainValidationError::EmptyTaskTitle);
    }

    #[test]
    fn task_from_draft_rejects_invalid_duration() {
        let draft = TaskDraft {
            title: "Write report".into(),
            duration_minutes: 0,
            ..TaskDraft::default()
        };

        let error = Task::from_draft(draft).expect_err("zero-minute task should fail validation");

        assert_eq!(
            error,
            DomainValidationError::InvalidTaskDuration {
                minutes: 0,
                min: 1,
                max: MAX_DURATION_MINUTES,
            }
        );
    }
}
