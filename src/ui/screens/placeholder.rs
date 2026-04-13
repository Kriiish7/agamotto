use gpui::{div, prelude::*};

use crate::{
    app::AppScreen,
    ui::theme::{self, colors},
};

pub fn render_placeholder(screen: AppScreen) -> impl IntoElement {
    let (index, body) = match screen {
        AppScreen::Tasks => (
            0,
            "Task capture will be introduced next, beginning with manual entry and task-list state.",
        ),
        AppScreen::Schedule => (
            1,
            "Serenity and Crunch scheduling pipelines will be wired into this screen in Phases 4 to 7.",
        ),
        AppScreen::Analytics => (
            2,
            "Metrics, model transparency, and learning insights will be surfaced here once scheduling is stable.",
        ),
        AppScreen::Planner => (
            3,
            "Forward planning and deadline risk alerts will arrive once the daily scheduler is working.",
        ),
        AppScreen::History => (
            4,
            "Saved schedules, actual outcomes, and review tools will be added after persistence is in place.",
        ),
    };

    div()
        .flex()
        .flex_col()
        .bg(colors::panel_background())
        .text_color(colors::text())
        .child(
            div()
                .text_color(theme::screen_accent(index))
                .text_xl()
                .child(screen.label()),
        )
        .child(div().text_color(colors::muted_text()).child(body))
}
