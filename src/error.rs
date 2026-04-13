use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("logging has already been initialised")]
    LoggingAlreadyInitialised,
}
