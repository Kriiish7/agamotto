use gpui::{div, prelude::*, rgb, Context, Window};

use crate::{
    app::{AppScreen, AppState},
    ui::{screens, theme},
};

pub struct AgamottoShell {
    state: AppState,
}

impl AgamottoShell {
    pub fn new() -> Self {
        Self {
            state: AppState::default(),
        }
    }
}

impl Render for AgamottoShell {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        let mut navigation = div().flex().flex_col();

        for screen in AppScreen::all() {
            let item = if screen == self.state.active_screen {
                format!("> {}: {}", screen.label(), screen.summary())
            } else {
                format!("  {}: {}", screen.label(), screen.summary())
            };

            navigation = navigation.child(
                div()
                    .text_color(if screen == self.state.active_screen {
                        theme::colors::accent()
                    } else {
                        theme::colors::muted_text()
                    })
                    .child(item),
            );
        }

        div()
            .flex()
            .flex_col()
            .size_full()
            .bg(theme::colors::app_background())
            .text_color(theme::colors::text())
            .child(
                div()
                    .bg(theme::colors::panel_background())
                    .text_color(theme::colors::text())
                    .text_xl()
                    .child("Agamotto"),
            )
            .child(
                div()
                    .bg(rgb(0x101726))
                    .text_color(theme::colors::muted_text())
                    .child("Adaptive, constraint-aware scheduling for focused work."),
            )
            .child(
                div()
                    .bg(theme::colors::panel_background())
                    .child("Navigation")
                    .child(navigation),
            )
            .child(screens::render_placeholder(self.state.active_screen))
            .child(
                div()
                    .bg(theme::colors::panel_background())
                    .text_color(theme::colors::muted_text())
                    .child(format!("Status: {}", self.state.status_line)),
            )
    }
}
