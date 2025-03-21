# Markdown

## Lists

### Unordered List

- Create a list by starting a line with `+`, `-`, or `*`
- Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
        - Ac tristique libero volutpat at
        * Facilisis in pretium nisl aliquet
        - Nulla volutpat aliquam velit
            - Test
- Very easy!

### Ordered List

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa

4. You can use sequential numbers...
5. ...or keep all the numbers as `1.`

### Mix Ordered and Unordered List

- Create a list by starting a line with `+`, `-`, or `*`
- Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
        1. Lorem ipsum dolor sit amet
        2. Consectetur adipiscing elit
        3. Integer molestie lorem at massa
- Very easy!

### Multiline list items

- **Current**: Under active development. Code for the Current release is in the
  branch for its major version number (for example,
  [v22.x](https://github.com/nodejs/node/tree/v22.x)). Node.js releases a new
  major version every 6 months, allowing for breaking changes. This happens in
  April and October every year. Releases appearing each October have a support
  life of 8 months. Releases appearing each April convert to LTS (see below)
  each October.
- **LTS**: Releases that receive Long Term Support, with a focus on stability
  and security. Every even-numbered major version will become an LTS release.
  LTS releases receive 12 months of _Active LTS_ support and a further 18 months
  of _Maintenance_. LTS release lines have alphabetically-ordered code names,
  beginning with v4 Argon. There are no breaking changes or feature additions,
  except in some special circumstances.
- **Nightly**: Code from the Current branch built every 24-hours when there are
  changes. Use with caution.

## Paragraph

This is a paragraph of text.
This should still be on the same line  
This should be a new line

- Here the paragraph should be terminated by the list
- List item 2

## Emphasis

```
*text*

**text**

_text_

__text__

***text***

_**text**_

**_text_**
```

### This is a heading

_text_

**text**

_text_

**text**

**_text_**

_**text**_

**_text_**

### This is a heading

## Escaping

```
\*text*

\*\*text\*\*

\_text\_

\**text\**

*\*text\**

**\*text\***
```

## Linking to headings

\*text\*

\*\*text\*\*

\_text\_

\*\*text\*\*

\*\*text\*\*

**\*text\***

## Codeblock

### Fenced

```js
var foo = function (bar) {
    return bar++;
};
```

Footnote[^1]

## Links

```markdown
[Link](www.google.com)

[Link with title](www.google.com "Google")

[Link with **markup**](www.google.com)

[_Another link with markup_](www.google.com)

[Link to first H1 heading](#markdown)
```

[Link](www.google.com)

[Link with title](www.google.com "Google")

[Link with **markup**](www.google.com)

[_Another link with markup_](www.google.com)

[An email address](test@email.com)

```
[Link to first H1 heading](#markdown)

[Link](#this-is-a-heading)

[Link to duplicate heading](#this-is-a-heading-1)
```

[Link to first H1 heading](#markdown)

[Link](#this-is-a-heading)

[Link to duplicate heading](#this-is-a-heading-1)

### Auto Links

www.google.com

google.com

https://github.com/

github.com/

github.com

test@email.com

### Reference Links

```
[link to github][github]

The following definition should not be visible.

[github]: github.com/ "GitHub link"

Here is another link to [github] [github]
```

[youtube.com](www.youtube.com)

[link to github][github]

The following definition should not be visible.

[github]: github.com/ "GitHub link"

Here is another link to [github] [github]

[^1]: footnote

- Create a list by starting a line with `+`, `-`, or `*`
- Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
        1. Lorem ipsum dolor sit amet
        2. Consectetur adipiscing elit
        3. Integer molestie lorem at massa
- Very easy!

- Create a list by starting a line with `+`, `-`, or `*`
- Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
        1. Lorem ipsum dolor sit amet
        2. Consectetur adipiscing elit
        3. Integer molestie lorem at massa
- Very easy!
