import unittest
import js

class MyVeryOwnTestResult(unittest.TestResult):

  def addSuccess(self, test):
    js.eval('alert("' + self.getDescription(test) + ': green")')

  def addFailure(self, test, reason):
    js.eval('alert("' + self.getDescription(test) + ': red")')

  def getDescription(self, test):
    doc_first_line = test.shortDescription()
    if doc_first_line:
      return '\n'.join((str(test), doc_first_line))
    else:
      return str(test)
