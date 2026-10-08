# Pulp Brand Kit 2026, v6d-LibreFranklin

The machine-readable half of the Pulp brand kit. The design canvas and these files are generated from one source, so they say the same thing.

## What

- `tokens.json`: every value. Colors by tier with roles and owners, mode tokens for Pulp, typodojo and Thinkwell, the dial and its twelve parameters, text roles, spacing, radii, widths, motion, symbols and banned words.
- `rules.json`: 194 rules. Each has an ID, a scope (house or one property), a check (`lint`, `layout` or `review`) and its text. Rules carried over from v5a or from Thinkwell's component contract name the ID they replace.
- `contracts.ts`: the types a build must satisfy, one block per section of the kit. It compiles under strict TypeScript.
- `motion.json` and `interactions.json`: every motion and every interactive part, with its states, keyboard and touch paths and ARIA.
- `sitemap.json`: every page with its purpose, audience, contents, action and visual.
- `social.json`: every platform's native size and safe area, its culture, each brand's voice on it, the kinds of engagement and who reposts whom, worked conversations, five templates a brand, and the first five posts on each platform with date, time, caption and alt text.
- `site.json`: how every page is built: the shell, section kinds, templates, each page's sections and the slots only Shah fills.
- `brand_lint.py`: a checker for every rule marked `lint` (59 rules). The other 29 are checked in the rendered layout pass and 106 by a person, by ID.

## How

1. Place the work on the dial: typodojo is -1 (less formal), Pulp and publishing are 0, Thinkwell is +1 (more formal). Anything a property does not set comes from Pulp.
2. Take every value from `tokens.json`. Never retype a value.
3. Run the lint on what you built, with the property:

       python3 brand_lint.py --property pulp site/index.html site/styles.css
       python3 brand_lint.py --property thinkwell app/**/*.tsx
       python3 brand_lint.py --self

   Each failure prints the file, line, rule ID and what was found. Exit code 1 means the build is rejected (R-PACK-02).
4. Render every page in light, dark and mono at 320, 390, 768, 1024, 1280, 1440 and 2000 px, portrait and landscape, at 200 percent zoom. Fix any collision, clipped text or target under 44 px (R-LAY-04, R-LAY-08, R-DATA-07).
5. Cite rule IDs in plans, reviews and commit messages (R-PACK-03).

## Summary, to paste into an agent

    You are building for Pulp (v6d-LibreFranklin). Read tokens.json and rules.json first.
    Place the work on the dial (typodojo -1, Pulp 0, Thinkwell +1) and take every
    unset parameter from Pulp. Use only token values. Never use italics in display
    type, em or en dashes, gradients outside the three --grad tokens, or colored
    edge stripes. Every surface ships in
    light, dark and mono and passes the switch test. Targets are 44 px. Secondary
    views float as modals. Spell Thinkwell with a lowercase w. Run brand_lint.py and
    the layout check before you hand anything back, and cite rule IDs in your summary.
    For pulp.com.ai, build each page from its template in site.json; leave a section
    out until its slot is filled, never ship placeholder text.
