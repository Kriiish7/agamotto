mod shell;
mod state;

use gpui::{prelude::*, App, WindowOptions};
use gpui_platform::application;
use tracing::info;

use self::shell::AgamottoShell;

pub use self::state::AppScreen;

pub fn run() {
    info!("starting Agamotto shell");

    application().run(|cx: &mut App| {
        cx.open_window(WindowOptions::default(), |window, cx| {
            cx.new(|cx| AgamottoShell::new(window, cx))
        })
        .expect("opening the main Agamotto window should succeed");
        cx.activate(true);
    });
}
