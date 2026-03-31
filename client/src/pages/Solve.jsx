import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import axiosClient from "../utils/axiosClient";
import CodeEditor from "../components/CodeEditor";

const Solve = () => {
  const [problem, setProblem] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await axiosClient.get(`/problem/${id}`);
        setProblem(response.data);
      } catch (error) {
        setProblem({ error: error.message });
      }
    };
    fetchProblem();
  }, [id]);

  if (!problem) return <div className="p-4">Loading...</div>;
  if (problem.error) return <div className="p-4 text-red-500">Error: {problem.error}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      {/* Problem Section */}
      <div className="p-4 bg-base-200 border-b border-base-300">
        <h2 className="text-2xl font-bold">{problem.title}</h2>
        <p className="mt-2 text-base">{problem.description}</p>
        <span className="badge badge-primary mt-2">{problem.difficulty}</span>
      </div>

      {/* Editor Section */}
      <div className="flex-1 p-4">
        <CodeEditor startCode={problem.startCode} />
      </div>
    </div>
  );
};

export default Solve;
