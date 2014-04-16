Pass - a very simple password storage mechanism
===============================================

`Pass` makes it easy to store passwords (or any other secret data). It
aims to be secure and easy to integrate with existing Unix tools and
version control. The encryption is all done by gpg, using one (or more)
keypairs, and the contents themselves are organized as YAML. A vim
plugin is provided to make editing the encrypted file easier.

Here's an example. The file is encrypted on disk with gpg:

```
$ cat ~/.pass/pass.gpg
-----BEGIN PGP MESSAGE-----
Version: GnuPG v1.4.15 (GNU/Linux)

hQQOAwC+u3g6GPWoEBAAtdHigCS83FWokK9fFAwjVNx1nhdVCWlReKgIftktoUKj
ZjKzBk9gLmUHi0UMVjAtbxkhscEzLtVyBhlhpIMbG2/iEjoxS90ZnBWhavJWGQtd
[...]
UC6q6YCaR9qcfhVHAvcBIuCq1u3GwsZd0NyY+buJj38APc1JZshugCWu
=/oK0
-----END PGP MESSAGE-----
```

The decrypted contents are YAML:

```
$ gpg -qd <~/.pass/pass.gpg
# recipient: me@example.com
mybank:
  desc: MyBank Savings and Loan
  username: me
  password: foo
```

Note that we didn't enter a passphrase above; this system works much
better if you use `gpg-agent`, which will prompt for and cache your
password outside of the terminal.

Using the vim plugin, you can edit it just like a regular file. The
decrypted contents are never stored on disk, and you can commit the
result. The version control system will see only the encrypted version,
so you are free to push it. A git diff-helper makes diffs more readable.

Updating an entry might look like this (the editing happens inside vim,
with the decryption/encryption steps transparent to the user):

```
$ vi ~/.pass/pass.gpg
$ git diff
diff --git a/pass.gpg b/pass.gpg
index f42955f..b42cffe 100644
--- a/pass.gpg
+++ b/pass.gpg
@@ -2,4 +2,4 @@
 mybank:
   desc: MyBank Savings and Loan
   username: me
-  password: foo
+  password: bar
```

You can query a whole subtree of data:

```
$ pass mybank
mybank.desc MyBank Savings and Loan
mybank.username me
mybank.password bar
```

or a specific item:

```
$ pass mybank.pass
mybank.password bar
```

Note that we don't need to use the full item name. The keys are
substring regexes, and can match either item names, or their `desc`
fields:

```
$ pass savings.user
mybank.username me
```

You can also send the result straight to the X clipboard with the `-p`
option, or list available keys with the `-l` option.


Setup
-----

To setup a password store, you need to do the following:

  1. Copy `pass` somewhere in your `$PATH`.

        cp pass ~/local/bin

  2. Create a gpg key if you don't already have one. Make sure you're
     using the gpg-agent for convenience.

        gpg --gen-key
        echo use-agent >>~/.gnupg/gpg.conf

  3. Create a repository for storing your data. If you choose another
     location, set `$PASS_HOME` to point `pass` to your repo.

        git init ~/.pass
        cd ~/.pass
        echo '# recipient: me@example.com' >pass.gpg
        echo '*.gpg diff=gpg' >.gitattributes
        git add . && git commit -m 'start pass repo'

  4. Tell git how to show diffs between gpg files.

        git config --global diff.gpg.textconv 'gpg -qd --no-tty'

  5. Install the vim plugin to make editing gpg files easier.

        mkdir -p ~/.vim/plugin
        cp gpg.vim ~/.vim/plugin

  6. Add some content. Note that your commit messages are _not_
     encrypted.

        cd ~/.pass
        vi pass.gpg
        git commit -am 'added password for mysite'


File Formats
------------

The gpg plugin does not care about the content of the file (so you can
use it for other things besides pass data), with one exception: any
lines at the beginning of the file starting with "# recipient: ..."
specify gpg key-ids which should be able to access the encrypted file.
Typically this will just be your email or key-id; but if you are sharing
the repository, you may also list the other group members (make sure gpg
knows about their keys, too).

The pass data itself is loaded via perl's YAML plugin, so any valid YAML
should work. The names of the elements are up to you, and you can make
hierarchies of arbitrary depth (e.g., `myproject.host1.mysql.password`).


Query Language
--------------

The query language is akin to XPath or CSS selectors, but much less
powerful (and hopefully simpler to use as a result). A key of the form
`a.b.c` will look for a YAML element matching `a`, which has a
sub-element matching `b`, and so forth. Each part of the key is a
case-insensitive regex, and must match either the hash key of the YAML
element, or the value of the `desc` field of the YAML element.

You may specify a key which is smaller than the full path. "Top" parts
of the hierarchy always match (so `b.c` will match `a.b.c`). "Bottom"
parts also match, so `a.b` will match `a.b.c` and `a.b.d`). Elements
between key parts must be matched (so `a.c` does not match `a.b.c`).


Pentadactyl Plugin
------------------

If you use the `pentadactyl` plugin for Firefox, there is a drop-in
plugin that can help with filling form fields from `pass` data:

  1. Copy the `autofill` plugin to your `.pentadactyl` directory:

        mkdir -p ~/.pentadactyl/plugins
        cp pentadactyl/autofill.js ~/.pentadactyl/plugins/

  2. Map URLs to `pass` sections (here, `example.user` and
     `example.pass` will be used to fill input elements):

        cat >~/.pentadactyl/pass.js <<\EOF
        plugins.autofill.add('^https://example\.com/', 'example');
        EOF

  3. Bind form-filling to a key (I use `Ctrl-F`), and load the mappings:

        cat >>~/.pentadactylrc <<\EOF
        loadplugins autofill
        runtime pass.js
        map <C-f> :js plugins.autofill.fill();<CR>
        imap <C-f> <Esc>:js plugins.autofill.fill();<CR>
        EOF

With the steps above, hitting `Ctrl-F` at `example.com` will fill any
input elements that look like usernames with the contents of
`example.user`, and any that look like passwords with
`example.password`.


Todo
----

This system is undoubtedly full of bugs. It works for me, but hasn't
received wide use. Due to offloading the cryptography to gpg, it is
hoped that all bugs are query bugs, and not security bugs. Success (or
failure) reports are welcome.

Setup could be simpler; possibly the system should provide a script to
help the user setup their keys and repository.

The query system is ad-hoc. It has worked well in practice, but it may
be that something like XPath would be more flexible, more standardized,
and not too much harder to use.

Some people might prefer another format, like JSON, over YAML. I think
YAML is easier for humans to write. The system could potentially allow
both (since it never writes, but only reads).

It would be helpful to integrate with tools that want to access the
passwords. I currently tie this to git with the following config:

    [credential "https://github.com"]
      username = peff
      helper = "!f() { test $1 = get && echo password=$(pass -n github.password); }; f"

though you could also build a fancier helper around it (e.g., storing
the URL along with the username and password, and then comparing it to
the URL git is trying to access).

The pentadactyl extension is rather simplistic. Manually constructing
URL regexes is error-prone (and has security implications if you are too
liberal). It looks only for `user` and `password` in input elements;
this matching heuristics probably need to be expanded. Firefox's
password manager already solves this problem, and it would be nice if we
could piggyback on that.
