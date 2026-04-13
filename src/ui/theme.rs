use gpui::{rgb, Rgba};

pub mod colors {
    use gpui::{rgb, Rgba};

    pub fn app_background() -> Rgba {
        rgb(0x0b1020)
    }

    pub fn panel_background() -> Rgba {
        rgb(0x162033)
    }

    pub fn text() -> Rgba {
        rgb(0xf5f7fa)
    }

    pub fn muted_text() -> Rgba {
        rgb(0xa7b3c8)
    }

    pub fn accent() -> Rgba {
        rgb(0x56d4ff)
    }
}

pub fn screen_accent(screen_index: usize) -> Rgba {
    match screen_index {
        0 => colors::accent(),
        1 => rgb(0x7ef29a),
        2 => rgb(0xffd166),
        3 => rgb(0xff8fab),
        _ => rgb(0xc3bef0),
    }
}
