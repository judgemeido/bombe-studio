# History layout repair · 2026-10-17

Skills used: systematic-debugging, frontend-design, test-driven-development, verification-before-completion.

Root cause: mobile seven-scene index used a two-column grid (231px tall), while the four-page navigation appended another wrapping header row (137px). At 390px viewport the heading began at y454 and imagery fell below the first screen. The late integration retained competing breakpoint rules and inconsistent 4.5%/8% content edges.

Repair retains the existing navy/archive serif direction, brass accent and historical copy. Navigation is subordinate: compact two-row masthead below1100px; contained horizontal seven-scene index, visible native scrollbar; unified 6vw editorial edges, balanced headings, image/copy top alignment. Narrow320px page nav uses explicit four equal tracks. No cipher/router/3D code changed.

Measured390px: masthead137→107px; index231→89px; h1 top454→260px. Screenshot now includes the image at the bottom of the first screen. At320px masthead105px and document scrollWidth==clientWidth305px. Seven tested viewport widths320/390/700/768/1000/1440/1920 showed no document horizontal overflow before the final320px header tightening;320 was rechecked afterwards.

TDD: layout contracts first failed2/3, then passed3/3; these are stylesheet contracts, not browser layout assertions. Actual DOM geometry and screenshots above provide visual evidence. npm test105/105; npm run build success. Screenshot mobile-after.jpg, desktop-after.jpg. Original reference screenshots are in output/history-00-p3.
