import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminAuth, ADMIN_API } from "../../contexts/AdminAuthContext";

type DailyData = {
  date: string;
  new_users: number;
  visitors: number;
};

type FunnelStage = {
  stage: string;
  value: number;
};

type CohortData = {
  cohort: string;
  size: number;
  day1: number;
  day7: number;
  day14: number;
  day30: number;
};

type FeatureUsage = {
  feature: string;
  users: number;
};

type AnalyticsResponse = {
  daily: DailyData[];
  totalUsers: number;
  founderCount: number;
  investorCount: number;
  funnel: FunnelStage[];
  cohorts: CohortData[];
  featureUsage: FeatureUsage[];
};

type DaysRange = 7 | 30 | 90;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getRetentionColor = (value: number): string => {
  if (value > 50) return "#1B6B3E";
  if (value >= 25) return "#3AAD6A";
  return "#DEEBE2";
};

const getRetentionTextColor = (value: number): string => {
  if (value > 50) return "#ffffff";
  return "#1A1A1A";
};

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <Card sx={{ p: 2, borderRadius: 2, flex: 1 }}>
    <Typography variant="caption" sx={{ color: "#8A8070", fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </Typography>
  </Card>
);

const FunnelChart = ({ data }: { data: FunnelStage[] }) => {
  if (!data.length) return null;

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Stack spacing={2}>
      {data.map((stage) => {
        const widthPercent = (stage.value / maxValue) * 100;
        const gradient = `linear-gradient(90deg, #1B6B3E, #DEEBE2)`;

        return (
          <Box key={stage.stage}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                {stage.stage}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#1B6B3E" }}>
                {stage.value.toLocaleString()}
              </Typography>
            </Box>
            <Box
              sx={{
                width: `${widthPercent}%`,
                height: 32,
                background: gradient,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "width 0.3s ease",
              }}
            />
          </Box>
        );
      })}
    </Stack>
  );
};

const RetentionTable = ({ data }: { data: CohortData[] }) => (
  <Table size="small" sx={{ "& td, & th": { padding: "8px" } }}>
    <TableHead>
      <TableRow sx={{ backgroundColor: "#E8E4DC" }}>
        <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>Cohort</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Size
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Day 1
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Day 7
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Day 14
        </TableCell>
        <TableCell align="center" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
          Day 30
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map((cohort) => (
        <TableRow key={cohort.cohort}>
          <TableCell sx={{ fontSize: "0.875rem", fontWeight: 500 }}>{cohort.cohort}</TableCell>
          <TableCell align="right" sx={{ fontSize: "0.875rem" }}>
            {cohort.size.toLocaleString()}
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontSize: "0.875rem",
              backgroundColor: getRetentionColor(cohort.day1),
              color: getRetentionTextColor(cohort.day1),
              fontWeight: 500,
            }}
          >
            {cohort.day1}%
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontSize: "0.875rem",
              backgroundColor: getRetentionColor(cohort.day7),
              color: getRetentionTextColor(cohort.day7),
              fontWeight: 500,
            }}
          >
            {cohort.day7}%
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontSize: "0.875rem",
              backgroundColor: getRetentionColor(cohort.day14),
              color: getRetentionTextColor(cohort.day14),
              fontWeight: 500,
            }}
          >
            {cohort.day14}%
          </TableCell>
          <TableCell
            align="center"
            sx={{
              fontSize: "0.875rem",
              backgroundColor: getRetentionColor(cohort.day30),
              color: getRetentionTextColor(cohort.day30),
              fontWeight: 500,
            }}
          >
            {cohort.day30}%
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default function AdminUserAnalyticsPage() {
  const { sessionToken } = useAdminAuth();
  const [days, setDays] = useState<DaysRange>(7);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${ADMIN_API}/analytics-users`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ session_token: sessionToken, days }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const analyticsData = (await response.json()) as AnalyticsResponse;
        setData(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    };

    if (sessionToken) {
      fetchAnalytics();
    }
  }, [sessionToken, days]);

  const newUsersSum =
    data?.daily.reduce((sum, day) => sum + day.new_users, 0) || 0;

  const chartData = data?.daily.map((day) => ({
    ...day,
    date: formatDate(day.date),
  })) || [];

  const newVsReturningData = chartData.map((day) => ({
    ...day,
    new_users: day.new_users,
    returning: Math.max(0, day.visitors - day.new_users),
  }));

  const sortedFeatures = [...(data?.featureUsage || [])].sort(
    (a, b) => b.users - a.users
  );

  return (
    <Box sx={{ p: 3, backgroundColor: "#FAF8F3", minHeight: "100vh" }}>
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1A1A1A" }}>
          User Analytics
        </Typography>
        <ButtonGroup variant="outlined" size="small">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              onClick={() => setDays(d as DaysRange)}
              variant={days === d ? "contained" : "outlined"}
              sx={{
                backgroundColor: days === d ? "#1B6B3E" : "transparent",
                color: days === d ? "#ffffff" : "#1B6B3E",
                borderColor: "#1B6B3E",
                textTransform: "none",
              }}
            >
              {d}d
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {error && (
        <Box sx={{ mb: 3, p: 2, backgroundColor: "#F5DDD9", borderRadius: 1 }}>
          <Typography sx={{ color: "#96271B" }}>Error: {error}</Typography>
        </Box>
      )}

      {!loading && data && (
        <Stack spacing={3}>
          <Stack direction="row" spacing={2}>
            <StatCard label="Total Users" value={data.totalUsers} />
            <StatCard label="Founders" value={data.founderCount} />
            <StatCard label="Investors" value={data.investorCount} />
            <StatCard label={`New (${days}d)`} value={newUsersSum} />
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Registration Trend
              </Typography>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#B5AE9F"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#B5AE9F" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #E8E4DC" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="new_users"
                      stroke="#1B6B3E"
                      fill="#1B6B3E"
                      fillOpacity={0.1}
                      dot={{ fill: "#1B6B3E", r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", height: 280, alignItems: "center" }}>
                  <CircularProgress />
                </Box>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Activation Funnel
              </Typography>
              {data.funnel.length > 0 ? (
                <FunnelChart data={data.funnel} />
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", height: 280, alignItems: "center" }}>
                  <CircularProgress />
                </Box>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Retention Cohorts
              </Typography>
              {data.cohorts.length > 0 ? (
                <Box sx={{ overflowX: "auto" }}>
                  <RetentionTable data={data.cohorts} />
                </Box>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", height: 280, alignItems: "center" }}>
                  <CircularProgress />
                </Box>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Feature Usage
              </Typography>
              {sortedFeatures.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    layout="vertical"
                    data={sortedFeatures}
                    margin={{ top: 0, right: 60, left: 100, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#B5AE9F" />
                    <YAxis dataKey="feature" type="category" tick={{ fontSize: 12 }} stroke="#B5AE9F" width={95} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #E8E4DC" }}
                    />
                    <Bar
                      dataKey="users"
                      fill="#1B6B3E"
                      label={{ position: "right", fontSize: 12, fill: "#1A1A1A" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", height: 280, alignItems: "center" }}>
                  <CircularProgress />
                </Box>
              )}
            </Card>

            <Card sx={{ p: 3, borderRadius: 2, gridColumn: "1 / -1" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                New vs Returning Users
              </Typography>
              {newVsReturningData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={newVsReturningData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#B5AE9F"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#B5AE9F" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #E8E4DC" }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="new_users"
                      stackId="1"
                      stroke="#1B6B3E"
                      fill="#1B6B3E"
                      fillOpacity={0.8}
                    />
                    <Area
                      type="monotone"
                      dataKey="returning"
                      stackId="1"
                      stroke="#DEEBE2"
                      fill="#DEEBE2"
                      fillOpacity={0.8}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", height: 280, alignItems: "center" }}>
                  <CircularProgress />
                </Box>
              )}
            </Card>
          </Box>
        </Stack>
      )}

      {loading && !data && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};
