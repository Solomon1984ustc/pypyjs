import unittest
import StringIO
import sys

def EOFcheck(test):
    def newfun(*args):
      try:
          test(*args)
      except EOFError:
          raise EOFError('Did you forget to close a parentheses or ask for more than one input?')
          return False
    return newfun

class RPS(unittest.TestCase):
    
    # the first three tests make sure that the file runs with each input
    @EOFcheck
    def testRock(self):
        s = StringIO.StringIO("rock")
        sys.stdin = s
        import hw0pr6
        s = StringIO.StringIO("rock")
        sys.stdin = s
        reload(hw0pr6)
        sys.stdin = sys.__stdin__
        return True
    
    @EOFcheck    
    def testPaper(self):
        s = StringIO.StringIO("paper")
        sys.stdin = s
        import hw0pr6
        s = StringIO.StringIO("paper")
        sys.stdin = s
        reload(hw0pr6)
        sys.stdin = sys.__stdin__
        return True

    @EOFcheck    
    def testScissors(self):
        s = StringIO.StringIO("scissors")
        sys.stdin = s
        import hw0pr6
        s = StringIO.StringIO("scissors")
        sys.stdin = s
        reload(hw0pr6)
        sys.stdin = sys.__stdin__
        return True

    # the last three tests make sure that some output is printed for each input
    # and that it includes the input as instructed
    @EOFcheck    
    def testRockOutput(self):
        s1 = StringIO.StringIO("rock")
        sys.stdin = s1
        s2 = StringIO.StringIO()
        sys.stdout = s2
        import hw0pr6
        s = StringIO.StringIO("rock")
        sys.stdin = s
        reload(hw0pr6)
        out = s2.getvalue()
        self.assertIn("rock", out)
        sys.stdin = sys.__stdin__
        sys.stdout = sys.__stdout__

    @EOFcheck    
    def testPaperOutput(self):
        s1 = StringIO.StringIO("paper")
        sys.stdin = s1
        s2 = StringIO.StringIO()
        sys.stdout = s2
        import hw0pr6
        s = StringIO.StringIO("paper")
        sys.stdin = s
        reload(hw0pr6)
        out = s2.getvalue()
        self.assertIn("paper", out)
        sys.stdin = sys.__stdin__
        sys.stdout = sys.__stdout__

    @EOFcheck    
    def testScissorsOutput(self):
        s1 = StringIO.StringIO("scissors")
        sys.stdin = s1
        s2 = StringIO.StringIO()
        sys.stdout = s2
        import hw0pr6
        s = StringIO.StringIO("scissors")
        sys.stdin = s
        reload(hw0pr6)
        out = s2.getvalue()
        self.assertIn("scissors", out)
        sys.stdin = sys.__stdin__
        sys.stdout = sys.__stdout__


if __name__ == '__main__':
    unittest.main(buffer = False)
