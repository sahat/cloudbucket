#!/usr/bin/env python

import sys

from docx import opendocx, getdocumenttext

if __name__ == '__main__':
    try:
        document = opendocx(sys.argv[1])
        newfile = open(sys.argv[2], 'w')
    except:
        print(
            "Please supply an input and output file. For example:\n"
            "  example-extracttext.py 'My Office 2007 document.docx' 'outp"
            "utfile.txt'"
        )
        exit()

    # Fetch all the text out of the document we just created
    paratextlist = getdocumenttext(document)

    # Make explicit unicode version
    newparatextlist = []
    for paratext in paratextlist:
        newparatextlist.append(paratext.encode("utf-8"))

    # Print out text of document with two newlines under each paragraph
    newfile.write('\n\n'.join(newparatextlist))