import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export type LegalBlock =
  | { p: string }
  | { ul: string[] }
  | { table: { head: string[]; rows: string[][] } };

export type LegalSection = { h: string; blocks: LegalBlock[] };

// Legal copy marks key phrases with **double asterisks**; render them bold.
function rich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

// Shared renderer for the Privacy and Terms pages. Left/right spacing is
// written LTR-style; the app's stylis RTL plugin flips it.
export default function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map(s => (
        <Box key={s.h} sx={{ mb: 3.5 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>{s.h}</Typography>
          {s.blocks.map((b, i) => {
            if ('p' in b) {
              return <Typography key={i} color="text.secondary" sx={{ lineHeight: 1.8, mb: 1 }}>{rich(b.p)}</Typography>;
            }
            if ('ul' in b) {
              return (
                <Box key={i} component="ul" sx={{ mt: 0, mb: 1.5, pl: 3 }}>
                  {b.ul.map(item => (
                    <Typography key={item} component="li" color="text.secondary" sx={{ lineHeight: 1.8, mb: 0.5 }}>{rich(item)}</Typography>
                  ))}
                </Box>
              );
            }
            return (
              <TableContainer key={i} component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      {b.table.head.map(cell => <TableCell key={cell} sx={{ fontWeight: 700 }}>{cell}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {b.table.rows.map(row => (
                      <TableRow key={row[0]} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        {row.map((cell, j) => <TableCell key={j} sx={{ color: 'text.secondary' }}>{rich(cell)}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })}
        </Box>
      ))}
    </>
  );
}
