# Markdown

## Lists

+ Create a list by starting a line with `+`, `-`, or `*`
+ Sub-lists are made by indenting 2 spaces:
  - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
      - Test
+ Very easy!

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

*text*

**text**

 _text_

__text__

***text***

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

\**text\**

*\*text\**

 **\*text\***


## Codeblock

### Fenced

```js
var foo = function (bar) {
  return bar++;
};
```


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

 Footnote[^1]

```
[link to github][github]

The following definition should not be visible.

[github]: github.com/ "GitHub link"

Here is another link to [github] [github]
```

[link to github][github]

The following definition should not be visible.

[github]: github.com/ "GitHub link"

Here is another link to [github] [github]


[^1]: footnote
