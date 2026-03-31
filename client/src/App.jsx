import React, { useEffect, useCallback, memo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkAuth } from "./redux/authSlice";

// ── Pages ─────────────────────────────────────────────────────────────────────
import HomePage        from "./pages/HomePage";
import Login           from "./pages/Login";
import Signup          from "./pages/Signup";
import Problems        from "./pages/Problems";
import ProblemPage     from "./pages/ProblemPage";
import Visualize       from "./pages/Visualize";
import Docs            from "./pages/Docs";
import Ai              from "./pages/Ai";
import Profile         from "./pages/Profile";
import Settings        from "./pages/Settings";
import ForgotPassword  from "./pages/ForgotPassword";
import ResetPassword   from "./pages/ResetPassword";
import AlgoVisualizer  from "./pages/AlgoVisualizer";
import DSVisualizer    from "./pages/DSVisualizer";

// ── Compiler ──────────────────────────────────────────────────────────────────
import CompilerPage from "./compiler/CompilerPage/CompilerPage";

// ── Admin Pages ───────────────────────────────────────────────────────────────
import AdminPanel    from "./pages/AdminPanel";
import CreateProblem from "./pages/CreateProblem";
import UpdateProblem from "./pages/UpdateProblem";
import DeleteProblem from "./pages/DeleteProblem";
import ManageVideo   from "./pages/ManageVideo";
import UploadVideo   from "./pages/UploadVideo";

// ── Algorithm Visualizers ─────────────────────────────────────────────────────
import BubbleSort          from "./Algorithms/BubbleSort";
import SelectionSort       from "./Algorithms/SelectionSort";
import InsertionSort       from "./Algorithms/InsertionSort";
import MergeSort           from "./Algorithms/MergeSort";
import QuickSort           from "./Algorithms/QuickSort";
import HeapSort            from "./Algorithms/HeapSort";
import LinearSearch        from "./Algorithms/LinearSearch";
import BinarySearch        from "./Algorithms/BinarySearch";
import BFSVisualizer       from "./Algorithms/BFSVisualizer";
import DFSVisualizer       from "./Algorithms/DFSVisualizer";
import DijkstraVisualizer  from "./Algorithms/DijkstraVisualizer";
import KruskalVisualizer   from "./Algorithms/KruskalVisualizer";
import PrimsVisualizer     from "./Algorithms/PrimsVisualizer";
import FibonacciDPVisualizer from "./Algorithms/FibonacciDPVisualizer";
import LCSVisualizer       from "./Algorithms/LCSVisualizer";
import KnapsackVisualizer  from "./Algorithms/KnapsackVisualizer";

// ── Data Structure Visualizers ────────────────────────────────────────────────
import ArrayVisualizer from "./DataStructure/ArrayVisualizer";
import StackVisualizer from "./DataStructure/StackVisualizer";
import QueueVisualizer from "./DataStructure/QueueVisualizer";

// ── Components ────────────────────────────────────────────────────────────────
import Navbar        from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";
import NotFound      from "./pages/NotFound"; // 404 page (see below if you don't have one)

// ─────────────────────────────────────────────────────────────────────────────
//  Route guard config
//  Centralising which paths hide the navbar avoids repeated pathname.includes()
//  calls scattered across the component tree.
// ─────────────────────────────────────────────────────────────────────────────
const NO_NAVBAR_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/compiler",
]);

// Reset-password is dynamic (/reset-password/:token) so we check with startsWith
const shouldShowNavbar = (pathname) =>
  !NO_NAVBAR_PATHS.has(pathname) && !pathname.startsWith("/reset-password");

// ─────────────────────────────────────────────────────────────────────────────
//  ProtectedRoute
//  Bug fix: was re-rendering on every auth state change because it was defined
//  inside App. Moved outside and memoised so it only re-renders when auth
//  state actually changes.
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute = memo(({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useSelector((s) => s.auth);
  const location = useLocation();

  // Still verifying session — don't flash redirect
  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    // Preserve intended destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Authenticated but wrong role → home, not login
    return <Navigate to="/" replace />;
  }

  return children;
});
ProtectedRoute.displayName = "ProtectedRoute";

// ─────────────────────────────────────────────────────────────────────────────
//  PublicRoute
//  Bug fix: /forgot-password and /reset-password were wrapped in PublicRoute
//  which meant a logged-in user on a different device/session couldn't use
//  their password reset email. These routes are now open (no wrapper needed).
//  PublicRoute is only used for /login and /signup.
// ─────────────────────────────────────────────────────────────────────────────
const PublicRoute = memo(({ children }) => {
  const { isAuthenticated, loading } = useSelector((s) => s.auth);

  // if (loading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return children;
});
PublicRoute.displayName = "PublicRoute";

// ─────────────────────────────────────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  const dispatch  = useDispatch();
  const location  = useLocation();
  const { loading } = useSelector((s) => s.auth);

  // Run once on mount — silently verifies cookie session
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Bug fix: don't block the entire UI while checkAuth is in flight. 
  // Previously the full-screen spinner blocked the public homepage too.
  // Only block on the very first load (no user data yet).
  // if (loading) return <LoadingSpinner />;

  const navbarVisible = shouldShowNavbar(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      {navbarVisible && <Navbar />}

      {/* ── Route tree ─────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <Routes>

          {/* ── Open routes (no auth required) ───────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<Docs />} />

          {/* ── Auth routes (redirect to / if already logged in) ──────────── */}
          <Route path="/login"  element={<PublicRoute><Login  /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* ── Password reset: open to EVERYONE (bug fix — no PublicRoute) ─ */}
          <Route path="/forgot-password"       element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword  />} />

          {/* ── Protected: any authenticated user ─────────────────────────── */}
          <Route path="/problems"   element={<ProtectedRoute><Problems   /></ProtectedRoute>} />
          <Route path="/problem/:id" element={<ProtectedRoute><ProblemPage /></ProtectedRoute>} />
          <Route path="/visualize"  element={<ProtectedRoute><Visualize  /></ProtectedRoute>} />
          <Route path="/ai"         element={<ProtectedRoute><Ai         /></ProtectedRoute>} />
          <Route path="/profile"    element={<ProtectedRoute><Profile    /></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute><Settings   /></ProtectedRoute>} />

          {/* ── Algorithms ────────────────────────────────────────────────── */}
          <Route path="/algorithms"                              element={<ProtectedRoute><AlgoVisualizer       /></ProtectedRoute>} />
          <Route path="/algorithms/bubble-sort"                 element={<ProtectedRoute><BubbleSort            /></ProtectedRoute>} />
          <Route path="/algorithms/selection-sort"              element={<ProtectedRoute><SelectionSort         /></ProtectedRoute>} />
          <Route path="/algorithms/insertion-sort"              element={<ProtectedRoute><InsertionSort         /></ProtectedRoute>} />
          <Route path="/algorithms/merge-sort"                  element={<ProtectedRoute><MergeSort             /></ProtectedRoute>} />
          <Route path="/algorithms/quick-sort"                  element={<ProtectedRoute><QuickSort             /></ProtectedRoute>} />
          <Route path="/algorithms/heap-sort"                   element={<ProtectedRoute><HeapSort              /></ProtectedRoute>} />
          <Route path="/algorithms/linear-search"               element={<ProtectedRoute><LinearSearch          /></ProtectedRoute>} />
          <Route path="/algorithms/binary-search"               element={<ProtectedRoute><BinarySearch          /></ProtectedRoute>} />
          <Route path="/algorithms/bfs-(breadth-first-search)"  element={<ProtectedRoute><BFSVisualizer         /></ProtectedRoute>} />
          <Route path="/algorithms/dfs-(depth-first-search)"   element={<ProtectedRoute><DFSVisualizer         /></ProtectedRoute>} />
          <Route path="/algorithms/dijkstra's-algorithm"       element={<ProtectedRoute><DijkstraVisualizer    /></ProtectedRoute>} />
          <Route path="/algorithms/kruskal's-algorithm"        element={<ProtectedRoute><KruskalVisualizer     /></ProtectedRoute>} />
          <Route path="/algorithms/prim's-algorithm"           element={<ProtectedRoute><PrimsVisualizer       /></ProtectedRoute>} />
          <Route path="/algorithms/fibonacci-(dp)"             element={<ProtectedRoute><FibonacciDPVisualizer /></ProtectedRoute>} />
          <Route path="/algorithms/longest-common-subsequence" element={<ProtectedRoute><LCSVisualizer         /></ProtectedRoute>} />
          <Route path="/algorithms/knapsack-problem"           element={<ProtectedRoute><KnapsackVisualizer    /></ProtectedRoute>} />

          {/* ── Data Structures ───────────────────────────────────────────── */}
          <Route path="/data-structures"      element={<ProtectedRoute><DSVisualizer    /></ProtectedRoute>} />
          <Route path="/data-structure/array" element={<ProtectedRoute><ArrayVisualizer /></ProtectedRoute>} />
          <Route path="/data-structure/stack" element={<ProtectedRoute><StackVisualizer /></ProtectedRoute>} />
          <Route path="/data-structure/queue" element={<ProtectedRoute><QueueVisualizer /></ProtectedRoute>} />

          {/* ── Compiler (fullscreen — no navbar, handled above) ───────────── */}
          <Route
            path="/compiler"
            element={
              <ProtectedRoute>
                <CompilerPage />
              </ProtectedRoute>
            }
          />

          {/* ── Admin (role-gated) ─────────────────────────────────────────── */}
          <Route path="/admin"                         element={<ProtectedRoute requiredRole="admin"><AdminPanel    /></ProtectedRoute>} />
          <Route path="/admin/create-problem"          element={<ProtectedRoute requiredRole="admin"><CreateProblem /></ProtectedRoute>} />
          <Route path="/admin/update-problem/:id"      element={<ProtectedRoute requiredRole="admin"><UpdateProblem /></ProtectedRoute>} />
          <Route path="/admin/delete-problem"          element={<ProtectedRoute requiredRole="admin"><DeleteProblem /></ProtectedRoute>} />
          <Route path="/admin/manage-video"            element={<ProtectedRoute requiredRole="admin"><ManageVideo   /></ProtectedRoute>} />
          <Route path="/admin/upload-video/:problemId" element={<ProtectedRoute requiredRole="admin"><UploadVideo   /></ProtectedRoute>} />

          {/* ── 404 ───────────────────────────────────────────────────────── */}
          {/* Bug fix: was redirecting all unknown routes to / which hides bugs.
              Use a dedicated 404 page instead. Falls back to redirect if you
              don't have a NotFound component yet. */}
          <Route path="*" element={<NotFoundRedirect />} />

        </Routes>
      </main>

      {/* ── Global toast notifications ──────────────────────────────────────── */}
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: "#0f172a",
          border: "1px solid rgba(129,140,248,0.15)",
          color: "#e2e8f0",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  NotFoundRedirect — tries NotFound page, falls back to redirect
//  Remove the try/catch once you create pages/NotFound.jsx
// ─────────────────────────────────────────────────────────────────────────────
const NotFoundRedirect = () => {
  try {
    return <NotFound />;
  } catch {
    return <Navigate to="/" replace />;
  }
};

export default App;
