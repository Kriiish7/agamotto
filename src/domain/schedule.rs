use serde::{Deserialize, Serialize};

use crate::domain::{task::Task, validation::DomainValidationError};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Mode {
    Serenity,
    Crunch,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ScheduleItem {
    task: Task,
    start_minute: u32,
    end_minute: u32,
}

impl ScheduleItem {
    pub fn new(
        task: Task,
        start_minute: u32,
        end_minute: u32,
    ) -> Result<Self, DomainValidationError> {
        if end_minute <= start_minute {
            return Err(DomainValidationError::InvalidScheduleRange {
                start_minute,
                end_minute,
            });
        }

        let scheduled_duration = end_minute - start_minute;
        if scheduled_duration != task.duration_minutes() {
            return Err(DomainValidationError::ScheduledDurationMismatch {
                expected_minutes: task.duration_minutes(),
                actual_minutes: scheduled_duration,
                task_title: task.title().to_owned(),
            });
        }

        Ok(Self {
            task,
            start_minute,
            end_minute,
        })
    }

    pub fn task(&self) -> &Task {
        &self.task
    }

    pub const fn start_minute(&self) -> u32 {
        self.start_minute
    }

    pub const fn end_minute(&self) -> u32 {
        self.end_minute
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Schedule {
    mode: Mode,
    items: Vec<ScheduleItem>,
}

impl Schedule {
    pub fn new(mode: Mode, items: Vec<ScheduleItem>) -> Result<Self, DomainValidationError> {
        for pair in items.windows(2) {
            let previous = &pair[0];
            let next = &pair[1];

            if next.start_minute() < previous.start_minute() {
                return Err(DomainValidationError::ScheduleItemsOutOfOrder {
                    previous_start_minute: previous.start_minute(),
                    next_start_minute: next.start_minute(),
                });
            }

            if next.start_minute() < previous.end_minute() {
                return Err(DomainValidationError::ScheduleItemsOverlap {
                    previous_end_minute: previous.end_minute(),
                    next_start_minute: next.start_minute(),
                    previous_task_title: previous.task().title().to_owned(),
                    next_task_title: next.task().title().to_owned(),
                });
            }
        }

        Ok(Self { mode, items })
    }

    pub const fn mode(&self) -> Mode {
        self.mode
    }

    pub fn items(&self) -> &[ScheduleItem] {
        &self.items
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::task::{Priority, TaskDraft, TaskType};

    fn sample_task(title: &str, duration_minutes: u32) -> Task {
        Task::from_draft(TaskDraft {
            title: title.into(),
            duration_minutes,
            priority: Priority::Medium,
            task_type: TaskType::Study,
            deadline: None,
            notes: None,
        })
        .expect("sample task should validate")
    }

    #[test]
    fn schedule_item_rejects_invalid_range() {
        let task = sample_task("Write summary", 30);

        let error =
            ScheduleItem::new(task, 60, 60).expect_err("zero-length range should fail validation");

        assert_eq!(
            error,
            DomainValidationError::InvalidScheduleRange {
                start_minute: 60,
                end_minute: 60,
            }
        );
    }

    #[test]
    fn schedule_rejects_overlapping_items() {
        let first = ScheduleItem::new(sample_task("Task 1", 30), 0, 30)
            .expect("first schedule item should be valid");
        let second = ScheduleItem::new(sample_task("Task 2", 20), 25, 45)
            .expect("second schedule item should be internally valid");

        let error = Schedule::new(Mode::Serenity, vec![first, second])
            .expect_err("overlapping items should fail validation");

        assert_eq!(
            error,
            DomainValidationError::ScheduleItemsOverlap {
                previous_end_minute: 30,
                next_start_minute: 25,
                previous_task_title: "Task 1".into(),
                next_task_title: "Task 2".into(),
            }
        );
    }
}
