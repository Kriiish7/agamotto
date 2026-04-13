use gpui::{
    div, prelude::*, px, rgb, App, ClickEvent, Context, Div, ElementId, FocusHandle, Focusable,
    FontWeight, IntoElement, KeyDownEvent, Stateful, Window,
};

use crate::ui::{screens, theme};

use super::state::{AppScreen, AppState, TaskEditorState, TaskFilter, TaskFormField, TaskRecord};

pub struct AgamottoShell {
    state: AppState,
    focus_handle: FocusHandle,
}

impl AgamottoShell {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let focus_handle = cx.focus_handle().tab_stop(true).tab_index(0);
        window.focus(&focus_handle, cx);

        Self {
            state: AppState::default(),
            focus_handle,
        }
    }

    fn on_key_down(&mut self, event: &KeyDownEvent, _: &mut Window, cx: &mut Context<Self>) {
        if self.state.handle_task_keydown(event) {
            cx.stop_propagation();
            cx.notify();
        }
    }

    fn select_screen(
        &mut self,
        screen: AppScreen,
        _: &ClickEvent,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.state.select_screen(screen);
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn select_field(
        &mut self,
        field: TaskFormField,
        _: &ClickEvent,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.state.select_field(field);
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn set_filter(
        &mut self,
        filter: TaskFilter,
        _: &ClickEvent,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.state.set_filter(filter);
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn cycle_priority(&mut self, _: &ClickEvent, window: &mut Window, cx: &mut Context<Self>) {
        self.state.cycle_priority();
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn cycle_task_type(&mut self, _: &ClickEvent, window: &mut Window, cx: &mut Context<Self>) {
        self.state.cycle_task_type();
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn cycle_deadline_kind(&mut self, _: &ClickEvent, window: &mut Window, cx: &mut Context<Self>) {
        self.state.cycle_deadline_kind();
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn submit_editor(&mut self, _: &ClickEvent, window: &mut Window, cx: &mut Context<Self>) {
        self.state.submit_editor();
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn clear_editor(&mut self, _: &ClickEvent, window: &mut Window, cx: &mut Context<Self>) {
        self.state.clear_editor();
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn toggle_task_completion(
        &mut self,
        task_id: u64,
        _: &ClickEvent,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.state.toggle_completed(task_id);
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn edit_task(
        &mut self,
        task_id: u64,
        _: &ClickEvent,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.state.start_editing(task_id);
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn delete_task(
        &mut self,
        task_id: u64,
        _: &ClickEvent,
        window: &mut Window,
        cx: &mut Context<Self>,
    ) {
        self.state.delete_task(task_id);
        window.focus(&self.focus_handle, cx);
        cx.notify();
    }

    fn render_navigation(&self, cx: &mut Context<Self>) -> impl IntoElement {
        let mut navigation = div().flex().flex_col().gap_2();

        for screen in AppScreen::all() {
            let is_active = screen == self.state.active_screen;
            navigation = navigation.child(
                chip_button(
                    screen.label(),
                    format!("{}.", screen.summary()),
                    is_active,
                    format!("nav-{}", screen.label().to_lowercase()),
                )
                .on_click(cx.listener(move |this, event, window, cx| {
                    this.select_screen(screen, event, window, cx)
                })),
            );
        }

        navigation
    }

    fn render_task_form(&self, cx: &mut Context<Self>) -> impl IntoElement {
        let editor = &self.state.editor;

        div()
            .flex()
            .flex_col()
            .gap_4()
            .child(div().text_xl().font_weight(FontWeight::BOLD).child(
                if editor.editing_task_id.is_some() {
                    "Edit Task"
                } else {
                    "New Task"
                },
            ))
            .child(
                div()
                    .text_color(theme::colors::muted_text())
                    .child("Click a field, type directly, press Enter to save, or Esc to clear."),
            )
            .child(self.render_field(
                cx,
                TaskFormField::Title,
                editor.title.as_str(),
                editor.editing_task_id.is_some(),
            ))
            .child(self.render_field(
                cx,
                TaskFormField::DurationMinutes,
                editor.duration_minutes.as_str(),
                editor.editing_task_id.is_some(),
            ))
            .child(self.render_field(
                cx,
                TaskFormField::Deadline,
                editor.deadline.as_str(),
                editor.editing_task_id.is_some(),
            ))
            .child(self.render_field(
                cx,
                TaskFormField::Notes,
                editor.notes.as_str(),
                editor.editing_task_id.is_some(),
            ))
            .child(
                div()
                    .flex()
                    .gap_2()
                    .child(
                        chip_button(
                            "Priority",
                            format!("{:?}", editor.priority),
                            true,
                            "priority-chip",
                        )
                        .on_click(cx.listener(Self::cycle_priority)),
                    )
                    .child(
                        chip_button("Type", format!("{:?}", editor.task_type), true, "type-chip")
                            .on_click(cx.listener(Self::cycle_task_type)),
                    )
                    .child(
                        chip_button(
                            "Deadline Kind",
                            format!("{:?}", editor.deadline_kind),
                            true,
                            "deadline-kind-chip",
                        )
                        .on_click(cx.listener(Self::cycle_deadline_kind)),
                    ),
            )
            .child(
                div()
                    .flex()
                    .gap_2()
                    .child(
                        action_button(
                            if editor.editing_task_id.is_some() {
                                "Save Changes"
                            } else {
                                "Add Task"
                            },
                            "enter",
                            "submit-task",
                        )
                        .on_click(cx.listener(Self::submit_editor)),
                    )
                    .child(
                        action_button("Clear", "esc", "clear-task")
                            .on_click(cx.listener(Self::clear_editor)),
                    ),
            )
    }

    fn render_field(
        &self,
        cx: &mut Context<Self>,
        field: TaskFormField,
        value: &str,
        is_editing: bool,
    ) -> impl IntoElement {
        let is_active = self.state.editor.active_field == field;
        let display_value = if value.is_empty() {
            TaskEditorState::placeholder(field).to_owned()
        } else {
            value.to_owned()
        };

        div()
            .id(format!(
                "field-{}",
                field.label().to_lowercase().replace(' ', "-")
            ))
            .flex()
            .flex_col()
            .gap_1()
            .p_3()
            .rounded_md()
            .border_1()
            .border_color(if is_active {
                theme::colors::accent()
            } else {
                rgb(0x263449)
            })
            .bg(if is_active {
                rgb(0x17233a)
            } else {
                theme::colors::panel_background()
            })
            .cursor_text()
            .on_click(cx.listener(move |this, event, window, cx| {
                this.select_field(field, event, window, cx)
            }))
            .child(
                div()
                    .text_sm()
                    .font_weight(FontWeight::BOLD)
                    .text_color(if is_active {
                        theme::colors::accent()
                    } else {
                        theme::colors::muted_text()
                    })
                    .child(field.label()),
            )
            .child(
                div()
                    .text_color(if value.is_empty() {
                        rgb(0x6f8199)
                    } else {
                        theme::colors::text()
                    })
                    .child(display_value),
            )
            .child(
                div()
                    .text_xs()
                    .text_color(theme::colors::muted_text())
                    .child(if is_editing && field == TaskFormField::Title {
                        "Editing existing task."
                    } else {
                        field.helper()
                    }),
            )
    }

    fn render_filter_bar(&self, cx: &mut Context<Self>) -> impl IntoElement {
        let mut row = div().flex().gap_2().items_center();

        for filter in TaskFilter::all() {
            let is_active = filter == self.state.filter;
            row = row.child(
                chip_button(
                    filter.label(),
                    if is_active { "active" } else { "show" },
                    is_active,
                    format!("filter-{}", filter.label().to_lowercase().replace(' ', "-")),
                )
                .on_click(cx.listener(move |this, event, window, cx| {
                    this.set_filter(filter, event, window, cx)
                })),
            );
        }

        row.child(
            div()
                .text_sm()
                .text_color(theme::colors::muted_text())
                .child(format!("{} visible", self.state.visible_task_count())),
        )
    }

    fn render_task_list(&self, cx: &mut Context<Self>) -> impl IntoElement {
        let mut list = div().flex().flex_col().gap_3();

        let visible_tasks: Vec<&TaskRecord> = self.state.visible_tasks().collect();
        if visible_tasks.is_empty() {
            list = list.child(
                div()
                    .p_4()
                    .rounded_md()
                    .bg(theme::colors::panel_background())
                    .text_color(theme::colors::muted_text())
                    .child("No tasks match the current filter yet."),
            );
        } else {
            for record in visible_tasks {
                list = list.child(self.render_task_row(cx, record));
            }
        }

        list
    }

    fn render_task_row(&self, cx: &mut Context<Self>, record: &TaskRecord) -> impl IntoElement {
        let task_id = record.id;
        let title = record.task.title().to_owned();
        let meta = format!(
            "{} min | {:?} | {:?}",
            record.task.duration_minutes(),
            record.task.priority(),
            record.task.task_type()
        );
        let deadline_text = record
            .task
            .deadline()
            .map(|deadline| {
                deadline
                    .due_at
                    .format(time::macros::format_description!(
                        "[year]-[month]-[day] [hour]:[minute]"
                    ))
                    .unwrap_or_else(|_| "invalid deadline".into())
            })
            .unwrap_or_else(|| "No deadline".into());
        let notes = record.task.notes().unwrap_or("No notes added.").to_owned();
        let status_text = if record.completed {
            "Completed"
        } else {
            "Open"
        };
        let title_color = if record.completed {
            rgb(0x7ef29a)
        } else {
            theme::colors::text()
        };
        let notes_color = if record.task.notes().is_some() {
            theme::colors::text()
        } else {
            theme::colors::muted_text()
        };

        div()
            .flex()
            .flex_col()
            .gap_2()
            .p_4()
            .rounded_md()
            .border_1()
            .border_color(if record.completed {
                rgb(0x2f855a)
            } else {
                rgb(0x243247)
            })
            .bg(theme::colors::panel_background())
            .child(
                div()
                    .flex()
                    .justify_between()
                    .items_center()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .gap_1()
                            .child(
                                div()
                                    .text_lg()
                                    .font_weight(FontWeight::BOLD)
                                    .text_color(title_color)
                                    .child(title),
                            )
                            .child(
                                div()
                                    .text_sm()
                                    .text_color(theme::colors::muted_text())
                                    .child(meta),
                            ),
                    )
                    .child(
                        div()
                            .text_sm()
                            .text_color(theme::colors::muted_text())
                            .child(status_text),
                    ),
            )
            .child(
                div()
                    .text_sm()
                    .text_color(theme::colors::muted_text())
                    .child(format!("Deadline: {deadline_text}")),
            )
            .child(div().text_sm().text_color(notes_color).child(notes))
            .child(
                div()
                    .flex()
                    .gap_2()
                    .child(
                        action_button(
                            if record.completed { "Undo" } else { "Complete" },
                            if record.completed { "reopen" } else { "done" },
                            format!("toggle-task-{}", task_id),
                        )
                        .on_click(cx.listener(
                            move |this, event, window, cx| {
                                this.toggle_task_completion(task_id, event, window, cx)
                            },
                        )),
                    )
                    .child(
                        action_button("Edit", "load", format!("edit-task-{}", task_id)).on_click(
                            cx.listener(move |this, event, window, cx| {
                                this.edit_task(task_id, event, window, cx)
                            }),
                        ),
                    )
                    .child(
                        action_button("Delete", "remove", format!("delete-task-{}", task_id))
                            .on_click(cx.listener(move |this, event, window, cx| {
                                this.delete_task(task_id, event, window, cx)
                            })),
                    ),
            )
    }

    fn render_tasks_screen(&self, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .flex()
            .flex_col()
            .gap_4()
            .child(
                div()
                    .flex()
                    .justify_between()
                    .items_end()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .gap_1()
                            .child(
                                div()
                                    .text_2xl()
                                    .font_weight(FontWeight::BOLD)
                                    .child("Task Capture"),
                            )
                            .child(
                                div()
                                    .text_color(theme::colors::muted_text())
                                    .child("Phase 3 brings manual task creation, in-memory backlog state, and edit controls."),
                            ),
                    )
                    .child(
                        div()
                            .text_sm()
                            .text_color(theme::colors::muted_text())
                            .child(format!("{} total tasks", self.state.tasks.len())),
                    ),
            )
            .child(self.render_filter_bar(cx))
            .child(
                div()
                    .flex()
                    .gap_4()
                    .items_start()
                    .child(
                        div()
                            .flex()
                            .flex_col()
                            .gap_3()
                            .w(px(420.0))
                            .p_4()
                            .rounded_lg()
                            .bg(theme::colors::panel_background())
                            .child(self.render_task_form(cx)),
                    )
                    .child(
                        div()
                            .flex_1()
                            .flex()
                            .flex_col()
                            .gap_3()
                            .p_4()
                            .rounded_lg()
                            .bg(theme::colors::panel_background())
                            .child(
                                div()
                                    .text_lg()
                                    .font_weight(FontWeight::BOLD)
                                    .child("Task Backlog"),
                            )
                            .child(self.render_task_list(cx)),
                    ),
            )
    }
}

impl Focusable for AgamottoShell {
    fn focus_handle(&self, _: &App) -> FocusHandle {
        self.focus_handle.clone()
    }
}

impl Render for AgamottoShell {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        div()
            .id("agamotto-shell")
            .track_focus(&self.focus_handle)
            .on_key_down(cx.listener(Self::on_key_down))
            .flex()
            .flex_col()
            .size_full()
            .bg(theme::colors::app_background())
            .text_color(theme::colors::text())
            .child(
                div()
                    .bg(theme::colors::panel_background())
                    .text_color(theme::colors::text())
                    .p_4()
                    .child(
                        div()
                            .text_xl()
                            .font_weight(FontWeight::BOLD)
                            .child("Agamotto"),
                    )
                    .child(
                        div()
                            .text_color(theme::colors::muted_text())
                            .child("Adaptive, constraint-aware scheduling for focused work."),
                    ),
            )
            .child(
                div()
                    .flex()
                    .gap_4()
                    .flex_1()
                    .p_4()
                    .child(
                        div()
                            .w(px(320.0))
                            .flex()
                            .flex_col()
                            .gap_3()
                            .child(
                                div()
                                    .p_4()
                                    .rounded_lg()
                                    .bg(theme::colors::panel_background())
                                    .child(
                                        div()
                                            .text_lg()
                                            .font_weight(FontWeight::BOLD)
                                            .child("Navigation"),
                                    )
                                    .child(
                                        div()
                                            .text_sm()
                                            .text_color(theme::colors::muted_text())
                                            .child("The Tasks screen is live. The other views will be filled in by later phases."),
                                    )
                                    .child(self.render_navigation(cx)),
                            )
                            .child(
                                div()
                                    .p_4()
                                    .rounded_lg()
                                    .bg(theme::colors::panel_background())
                                    .child(
                                        div()
                                            .text_lg()
                                            .font_weight(FontWeight::BOLD)
                                            .child("Plan Context"),
                                    )
                                    .child(
                                        div()
                                            .text_sm()
                                            .text_color(theme::colors::muted_text())
                                            .child(format!(
                                                "{} min available | focus block {} min | {:?}",
                                                self.state.settings.available_minutes(),
                                                self.state.settings.focus_block_minutes(),
                                                self.state.settings.chronotype()
                                            )),
                                    ),
                            ),
                    )
                    .child(
                        div()
                            .flex_1()
                            .child(match self.state.active_screen {
                                AppScreen::Tasks => self.render_tasks_screen(cx).into_any_element(),
                                other => screens::render_placeholder(other).into_any_element(),
                            }),
                    ),
            )
            .child(
                div()
                    .bg(theme::colors::panel_background())
                    .text_color(theme::colors::muted_text())
                    .p_4()
                    .child(format!("Status: {}", self.state.status_line)),
            )
    }
}

fn chip_button(
    label: impl Into<String>,
    detail: impl Into<String>,
    active: bool,
    id: impl Into<ElementId>,
) -> Stateful<Div> {
    let label = label.into();
    let detail = detail.into();

    div()
        .id(id)
        .flex()
        .flex_col()
        .gap_1()
        .p_3()
        .rounded_md()
        .border_1()
        .border_color(if active {
            theme::colors::accent()
        } else {
            rgb(0x263449)
        })
        .bg(if active {
            rgb(0x17233a)
        } else {
            theme::colors::panel_background()
        })
        .cursor_pointer()
        .hover(|style| style.bg(rgb(0x192640)))
        .child(
            div()
                .font_weight(FontWeight::BOLD)
                .text_color(theme::colors::text())
                .child(label),
        )
        .child(
            div()
                .text_sm()
                .text_color(theme::colors::muted_text())
                .child(detail),
        )
}

fn action_button(
    label: impl Into<String>,
    detail: impl Into<String>,
    id: impl Into<ElementId>,
) -> Stateful<Div> {
    let label = label.into();
    let detail = detail.into();

    div()
        .id(id)
        .flex()
        .items_center()
        .gap_2()
        .px_3()
        .py_2()
        .rounded_md()
        .border_1()
        .border_color(rgb(0x29415e))
        .bg(rgb(0x132034))
        .cursor_pointer()
        .hover(|style| style.bg(rgb(0x192a42)))
        .child(
            div()
                .font_weight(FontWeight::BOLD)
                .text_color(theme::colors::text())
                .child(label),
        )
        .child(
            div()
                .text_sm()
                .text_color(theme::colors::muted_text())
                .child(detail),
        )
}
