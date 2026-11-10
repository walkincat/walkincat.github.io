# UTM rules for shared links

Every link to walkincat.org that is shared outside the site uses these parameters:

```
?utm_source=<x|threads|fb|ig|newsletter>&utm_medium=social&utm_campaign=<post-slug>&utm_content=<post id or version>
```

| Parameter | Value |
|---|---|
| `utm_source` | One of `x`, `threads`, `fb`, `ig`, `newsletter` |
| `utm_medium` | Always `social` |
| `utm_campaign` | The post slug, i.e. the file name in `content/` (`content/bitgin.md` → `bitgin`) |
| `utm_content` | The ID of the social post, or a version label |

Example:

```
https://walkincat.org/posts/bitgin/?utm_source=x&utm_medium=social&utm_campaign=bitgin&utm_content=v1
```

## Canonical URLs carry no parameters

The canonical URL and the sitemap `<loc>` never include query parameters (see "SEO rules" in the [README](../README.md#seo-rules)). UTM parameters only appear on links shared elsewhere.

## Reporting

Whether Cloudflare Web Analytics can group page views by query parameter is not verified yet. If it cannot, reports split traffic by referrer host instead and say so.
