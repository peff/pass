autocmd BufReadPre *.gpg call s:GPGSetup()
autocmd BufReadPost *.gpg call s:GPGDecrypt()
autocmd BufWritePre *.gpg call s:GPGEncrypt()
autocmd BufWritePost *.gpg call s:GPGEncryptPost()

function s:GPGSetup()
  set viminfo=
  set noswapfile
  set binary
endfunction

function s:GPGDecrypt()
  silent! %!gpg -qd --no-tty
  if v:shell_error
    silent! undo
  else
    set nobinary
  endif
endfunction

function s:GPGEncrypt()
  let line = 1
  let recipients = []

  while getline(line) =~ '^#'
    let match = matchlist(getline(line), '# recipient: \(.*\)')
    if !empty(match)
      let recipients += [match[1]]
    endif
    let line = line + 1
  endwhile

  if !empty(recipients)
    let s:GPGSavedView = winsaveview()
    exe "%!gpg -aqe " . join(map(recipients, '"-r " . shellescape(v:val)'))
    if v:shell_error
      silent! undo
      call winrestview(s:GPGSavedView)
      throw "unable to write encrypted file"
    endif
  endif
endfunction

function s:GPGEncryptPost()
  silent! undo
  call winrestview(s:GPGSavedView)
endfunction
