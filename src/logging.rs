use tracing_subscriber::EnvFilter;

use crate::error::{AppError, AppResult};

pub fn init_logging() -> AppResult<()> {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("agamotto=info,gpui=warn"));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .compact()
        .try_init()
        .map_err(|_| AppError::LoggingAlreadyInitialised)
}
