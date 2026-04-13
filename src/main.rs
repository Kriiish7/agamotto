mod app;
mod domain;
mod error;
mod logging;
mod ml;
mod nlp;
mod scheduling;
mod storage;
mod ui;

fn main() {
    if let Err(error) = logging::init_logging() {
        eprintln!("failed to initialise logging: {error}");
    }

    app::run();
}
