use thiserror::Error;

#[derive(Debug, Error, Clone, PartialEq, Eq)]
pub enum DomainValidationError {
    #[error("task title cannot be empty")]
    EmptyTaskTitle,

    #[error("task title is too long: {length} characters, maximum {max}")]
    TaskTitleTooLong { length: usize, max: usize },

    #[error("task duration must be between {min} and {max} minutes, got {minutes}")]
    InvalidTaskDuration { minutes: u32, min: u32, max: u32 },

    #[error("task notes are too long: {length} characters, maximum {max}")]
    TaskNotesTooLong { length: usize, max: usize },

    #[error("available planning window must be between {min} and {max} minutes, got {minutes}")]
    InvalidAvailableMinutes { minutes: u32, min: u32, max: u32 },

    #[error("focus block must be between {min} and {max} minutes, got {minutes}")]
    InvalidFocusBlockMinutes { minutes: u32, min: u32, max: u32 },

    #[error(
        "focus block of {focus_block_minutes} minutes cannot exceed available window of {available_minutes} minutes"
    )]
    FocusBlockExceedsWindow {
        focus_block_minutes: u32,
        available_minutes: u32,
    },

    #[error("schedule item start {start_minute} must be before end {end_minute}")]
    InvalidScheduleRange { start_minute: u32, end_minute: u32 },

    #[error(
        "task '{task_title}' was scheduled for {actual_minutes} minutes but expects {expected_minutes}"
    )]
    ScheduledDurationMismatch {
        expected_minutes: u32,
        actual_minutes: u32,
        task_title: String,
    },

    #[error(
        "schedule items overlap: '{previous_task_title}' ends at {previous_end_minute} but '{next_task_title}' starts at {next_start_minute}"
    )]
    ScheduleItemsOverlap {
        previous_end_minute: u32,
        next_start_minute: u32,
        previous_task_title: String,
        next_task_title: String,
    },

    #[error(
        "schedule items are out of order: previous start {previous_start_minute}, next start {next_start_minute}"
    )]
    ScheduleItemsOutOfOrder {
        previous_start_minute: u32,
        next_start_minute: u32,
    },
}
