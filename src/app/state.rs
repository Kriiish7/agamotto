use gpui::SharedString;

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
            Self::Tasks => "Capture and review tasks before scheduling is introduced.",
            Self::Schedule => {
                "Schedule generation and explanations will live here in later phases."
            }
            Self::Analytics => "Metrics, ML insights, and usage trends will be surfaced here.",
            Self::Planner => "The multi-day workload view and risk alerts will arrive here.",
            Self::History => "Completed schedules and outcome review will be available here.",
        }
    }
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub active_screen: AppScreen,
    pub status_line: SharedString,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            active_screen: AppScreen::Tasks,
            status_line: "Phase 1 foundation complete: shell, modules, and placeholders are ready."
                .into(),
        }
    }
}
