#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Chronotype {
    Morning,
    Balanced,
    Evening,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AppSettings {
    pub available_minutes: u32,
    pub chronotype: Chronotype,
    pub breaks_enabled: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            available_minutes: 240,
            chronotype: Chronotype::Balanced,
            breaks_enabled: true,
        }
    }
}
