import { forwardRef } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import MuiArrowBack from '@mui/icons-material/ArrowBack';
import MuiArrowForward from '@mui/icons-material/ArrowForward';
import MuiArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import MuiArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import MuiSend from '@mui/icons-material/Send';
import MuiSendOutlined from '@mui/icons-material/SendOutlined';
import MuiLogin from '@mui/icons-material/Login';
import MuiLoginOutlined from '@mui/icons-material/LoginOutlined';
import MuiLogout from '@mui/icons-material/Logout';
import MuiReply from '@mui/icons-material/Reply';

// The RTL stylis plugin mirrors CSS, but not the SVG glyphs inside icons, so
// direction-of-travel icons still point the Latin way. These drop-in
// replacements mirror them: "back" points right and "forward" points left, as
// Arabic readers expect. Import from here instead of @mui/icons-material.
//
// Chevrons are deliberately not wrapped — code picks ChevronLeft/ChevronRight
// per context (e.g. founder/overview/JourneyOverview.tsx), and mirroring would
// undo those choices.
function mirrored(Icon: typeof MuiArrowBack) {
  const Mirrored = forwardRef<SVGSVGElement, SvgIconProps>(function Mirrored({ sx, ...props }, ref) {
    return <Icon ref={ref} {...props} sx={[{ transform: 'scaleX(-1)' }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]} />;
  });
  // MUI components that special-case icon children check muiName.
  return Object.assign(Mirrored, { muiName: Icon.muiName });
}

export const ArrowBackIcon = mirrored(MuiArrowBack);
export const ArrowForwardIcon = mirrored(MuiArrowForward);
export const ArrowForwardOutlinedIcon = mirrored(MuiArrowForwardOutlined);
export const ArrowForwardIosIcon = mirrored(MuiArrowForwardIos);
export const SendIcon = mirrored(MuiSend);
export const SendOutlinedIcon = mirrored(MuiSendOutlined);
export const LoginIcon = mirrored(MuiLogin);
export const LoginOutlinedIcon = mirrored(MuiLoginOutlined);
export const LogoutIcon = mirrored(MuiLogout);
export const ReplyIcon = mirrored(MuiReply);
