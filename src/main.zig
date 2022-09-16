const std = @import("std");

const c = @cImport(@cInclude("ltcdec.c"));

pub fn main() anyerror!void {
    const dec = c.ltc_dec_create(48000.0);
    c.ltc_dec_free(dec);
}
