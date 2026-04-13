use time::OffsetDateTime;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TaskType {
    Study,
    Coding,
    Admin,
    Personal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Task {
    pub title: String,
    pub duration_minutes: u32,
    pub priority: Priority,
    pub task_type: TaskType,
    pub deadline: Option<OffsetDateTime>,
    pub notes: Option<String>,
}
