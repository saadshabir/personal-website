# Header font

`noto-nastaliq-urdu-name.woff2` is Noto Nastaliq Urdu Regular v3.007,
subset to `محمد سعد شبیر`. It is used only by `.site-name-urdu` and
is self-hosted by `next/font/local`. The SIL Open Font License is in `OFL.txt`.

The source was the Arabic WOFF2 previously downloaded by `next/font/google`
for `Noto_Nastaliq_Urdu({ weight: "400", subsets: ["arabic"] })`.
The subset preserves all OpenType layout features, including contextual Urdu
letter shaping. Generated with fonttools 4.60.2 and Brotli 1.2.0 or newer:

```sh
pyftsubset /path/to/original-regular.woff2 \
  --text='محمد سعد شبیر' --layout-features='*' --glyph-names \
  --flavor=woff2 --output-file=app/fonts/noto-nastaliq-urdu-name.woff2
```

If the Urdu header text changes, regenerate the subset from the full original
font using the new text, then verify its shaping and layout in the browser.
