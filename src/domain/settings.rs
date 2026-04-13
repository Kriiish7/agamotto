use serde::{Deserialize, Serialize};

use crate::domain::validation::DomainValidationError;

const DEFAULT_AVAILABLE_MINUTES: u32 = 240;
const DEFAULT_FOCUS_BLOCK_MINUTES: u32 = 60;
const MAX_AVAILABLE_MINUTES: u32 = 24 * 60;
const MIN_FOCUS_BLOCK_MINUTES: u32 = 15;
const MAX_FOCUS_BLOCK_MINUTES: u32 = 180;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Chronotype {
    Morning,
    Balanced,
    Evening,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AppSettings {
    available_minutes: u32,
    focus_block_minutes: u32,
    chronotype: Chronotype,
    breaks_enabled: bool,
}

impl AppSettings {
    pub fn new(
        available_minutes: u32,
        focus_block_minutes: u32,
        chronotype: Chronotype,
        breaks_enabled: bool,
    ) -> Result<Self, DomainValidationError> {
        if !(1..=MAX_AVAILABLE_MINUTES).contains(&available_minutes) {
            return Err(DomainValidationError::InvalidAvailableMinutes {
                minutes: available_minutes,
                min: 1,
                max: MAX_AVAILABLE_MINUTES,
            });
        }

        if !(MIN_FOCUS_BLOCK_MINUTES..=MAX_FOCUS_BLOCK_MINUTES).contains(&focus_block_minutes) {
            return Err(DomainValidationError::InvalidFocusBlockMinutes {
                minutes: focus_block_minutes,
                min: MIN_FOCUS_BLOCK_MINUTES,
                max: MAX_FOCUS_BLOCK_MINUTES,
            });
        }

        if focus_block_minutes > available_minutes {
            return Err(DomainValidationError::FocusBlockExceedsWindow {
                focus_block_minutes,
                available_minutes,
            });
        }

        Ok(Self {
            available_minutes,
            focus_block_minutes,
            chronotype,
            breaks_enabled,
        })
    }

    pub const fn available_minutes(&self) -> u32 {
        self.available_minutes
    }

    pub const fn focus_block_minutes(&self) -> u32 {
        self.focus_block_minutes
    }

    pub const fn chronotype(&self) -> Chronotype {
        self.chronotype
    }

    pub const fn breaks_enabled(&self) -> bool {
        self.breaks_enabled
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            available_minutes: DEFAULT_AVAILABLE_MINUTES,
            focus_block_minutes: DEFAULT_FOCUS_BLOCK_MINUTES,
            chronotype: Chronotype::Balanced,
            breaks_enabled: true,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_settings_reject_invalid_available_minutes() {
        let error = AppSettings::new(0, 60, Chronotype::Balanced, true)
            .expect_err("zero available minutes should fail validation");

        assert_eq!(
            error,
            DomainValidationError::InvalidAvailableMinutes {
                minutes: 0,
                min: 1,
                max: MAX_AVAILABLE_MINUTES,
            }
        );
    }

    #[test]
    fn app_settings_reject_focus_block_longer_than_window() {
        let error = AppSettings::new(45, 60, Chronotype::Balanced, true)
            .expect_err("focus block longer than window should fail validation");

        assert_eq!(
            error,
            DomainValidationError::FocusBlockExceedsWindow {
                focus_block_minutes: 60,
                available_minutes: 45,
            }
        );
    }
}
