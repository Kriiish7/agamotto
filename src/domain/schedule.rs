#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Serenity,
    Crunch,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScheduleItem {
    pub task_title: String,
    pub start_minute: u32,
    pub end_minute: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Schedule {
    pub mode: Mode,
    pub items: Vec<ScheduleItem>,
}
