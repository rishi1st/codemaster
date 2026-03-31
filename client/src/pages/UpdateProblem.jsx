import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router';
import { FiChevronLeft } from 'react-icons/fi';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-toastify';
import ProblemForm from '../components/ProblemForm';

// Zod schema with validation
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'string', 'linkedList', 'tree', 'graph', 'dp', 'math', 'recursion', 'search', 'sorting']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required').max(1000, 'Input too long'),
      output: z.string().min(1, 'Output is required').max(1000, 'Output too long'),
      explanation: z.string().min(1, 'Explanation is required').max(1000, 'Explanation too long')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required').max(1000, 'Input too long'),
      output: z.string().min(1, 'Output is required').max(1000, 'Output too long')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript', 'python']),
      initialCode: z.string().min(1, 'Initial code is required').max(10000, 'Code too long')
    })
  ).min(1, 'At least one language required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript', 'python']),
      completeCode: z.string().min(1, 'Complete code is required').max(10000, 'Code too long')
    })
  ).min(1, 'At least one language required')
});

const UpdateProblem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: 'array',
      visibleTestCases: [{ input: '', output: '', explanation: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: [{ language: 'c++', initialCode: '' }],
      referenceSolution: [{ language: 'c++', completeCode: '' }]
    }
  });

  // Fetch problem data
  const fetchProblem = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsFetching(true);
      console.log(id)
      const { data } = await axiosClient.get(`/problem/${id}`);
      console.log(data)
      reset({
        ...data,
        visibleTestCases: data.visibleTestCases?.length ? data.visibleTestCases : [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: data.hiddenTestCases?.length ? data.hiddenTestCases : [{ input: '', output: '' }],
        startCode: data.startCode?.length ? data.startCode : [{ language: 'c++', initialCode: '' }],
        referenceSolution: data.referenceSolution?.length ? data.referenceSolution : [{ language: 'c++', completeCode: '' }]
      });
    } catch (error) {
      console.error('Error fetching problem:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
      navigate('/admin');
    } finally {
      setIsFetching(false);
    }
  }, [id, reset, navigate]);

  useEffect(() => {
    if (id) fetchProblem();
  }, [id, fetchProblem]);

  const onSubmit = async (formData) => {
    setIsLoading(true);
    try {
      // Format data according to required schema
      const submissionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        tags: formData.tags,
        visibleTestCases: formData.visibleTestCases.map(tc => ({
          input: tc.input.trim(),
          output: tc.output.trim(),
          explanation: tc.explanation.trim()
        })),
        hiddenTestCases: formData.hiddenTestCases.map(tc => ({
          input: tc.input.trim(),
          output: tc.output.trim()
        })),
        startCode: formData.startCode.map(sc => ({
          language: sc.language,
          initialCode: sc.initialCode.trim()
        })),
        referenceSolution: formData.referenceSolution.map(rs => ({
          language: rs.language,
          completeCode: rs.completeCode.trim()
        }))
      };

      await axiosClient.put(`/problem/update/${id}`, submissionData);
      toast.success('Problem updated successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error updating problem:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-400 hover:text-blue-300 mr-4"
          >
            <FiChevronLeft className="mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">Edit Problem</h1>
        </div>
        
        <ProblemForm
          isEditMode={true}
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          control={control}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default UpdateProblem;