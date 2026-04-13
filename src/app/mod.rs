mod shell;
mod state;

use gpui::{prelude::*, App, WindowOptions};
use gpui_platform::application;
use tracing::info;

use self::shell::AgamottoShell;

pub use self::state::{AppScreen, AppState};

pub fn run() {
    info!("starting Agamotto shell");

    application().run(|cx: &mut App| {
        cx.open_window(WindowOptions::default(), |_, cx| {
            cx.new(|_cx| AgamottoShell::new())
        })
        .expect("opening the main Agamotto window should succeed");
        cx.activate(true);
    });
}
