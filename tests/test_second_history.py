import importlib.util,lzma,struct,unittest
from pathlib import Path
p=Path(__file__).parents[1]/'tools/download-second-history.py'
s=importlib.util.spec_from_file_location('second_history',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
def raw(rows):return lzma.compress(b''.join(struct.pack('>3I2f',*r) for r in rows))
class Seconds(unittest.TestCase):
 def test_bid_ask_extremes_and_missing_seconds(self):
  rows,q=m.decode_ticks(raw([(1,111812,111810,1,2),(800,111816,111814,1,1),(2200,111813,111811,1,1)]),100,100000)
  self.assertEqual([x[0] for x in rows],[100,102]);self.assertEqual(rows[0][1:5],['1.11810','1.11814','1.11810','1.11814']);self.assertEqual(rows[0][5:9],['1.11812','1.11816','1.11812','1.11816']);self.assertEqual(q['ticks'],3)
  larger=m.aggregate(rows,60);self.assertEqual(larger[0][4],'1.11811');self.assertEqual(larger[0][-1],3)
 def test_rejects_crossed_reversed_and_outside_hour_ticks(self):
  for ticks in [[(0,100,101,1,1)],[(2,102,100,1,1),(1,102,100,1,1)],[(3600000,102,100,1,1)]]:
   with self.assertRaises(ValueError):m.decode_ticks(raw(ticks),0,1000)
 def test_jpy_scale_empty_and_truncation(self):
  rows,_=m.decode_ticks(raw([(5,156900,156899,1,1)]),0,1000);self.assertEqual(rows[0][1],'156.899')
  self.assertEqual(m.decode_ticks(b'',0,100000)[0],[])
  with self.assertRaises(ValueError):m.decode_ticks(lzma.compress(b'x'),0,100000)
if __name__=='__main__':unittest.main()
