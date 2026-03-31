import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { FiChevronLeft, FiPlus, FiTrash2, FiCode, FiCpu, FiEye, FiEyeOff } from 'react-icons/fi';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-toastify';

// Zod schema matches backend
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(5000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.string().min(1, 'Tag is required'),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case is required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case is required'),
  startCode: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript', 'python']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).min(1, 'Start code for at least one language is required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['c++', 'java', 'javascript', 'python']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).min(1, 'Reference solution for at least one language is required')
});

const CreateProblem = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: '',
      visibleTestCases: [{ input: '', output: '', explanation: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: [{ language: 'c++', initialCode: '' }],
      referenceSolution: [{ language: 'c++', completeCode: '' }]
    }
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const { fields: startCodeFields, append: appendStartCode, remove: removeStartCode } = useFieldArray({
    control,
    name: 'startCode'
  });

  const { fields: refSolutionFields, append: appendRefSolution, remove: removeRefSolution } = useFieldArray({
    control,
    name: 'referenceSolution'
  });

  const onSubmit = async (data) => {
  setIsLoading(true);

  try {
    const submissionData = {
      title: data.title.trim(),
      description: data.description.trim(),
      difficulty: data.difficulty,
      tags: data.tags.trim().toLowerCase(), // make lowercase or handle as array
      visibleTestCases: data.visibleTestCases.map(tc => ({
        input: tc.input.trim(),
        output: tc.output.trim(),
        explanation: tc.explanation.trim()
      })),
      hiddenTestCases: data.hiddenTestCases.map(tc => ({
        input: tc.input.trim(),
        output: tc.output.trim()
      })),
      startCode: data.startCode.map(sc => ({
        language: sc.language.toLowerCase(),
        initialCode: sc.initialCode.trim()
      })),
      referenceSolution: data.referenceSolution.map(rs => ({
        language: rs.language.toLowerCase(),
        completeCode: rs.completeCode.trim()
      }))
    };

    const response = await axiosClient.post('/problem/create', submissionData);
    toast.success('Problem created successfully!');
    navigate('/admin');
  } catch (error) {
    console.error(error);
    const message = error.response?.data?.error || 'Failed to create problem';
    const details = error.response?.data?.details;
    toast.error(message + (details ? ` - ${JSON.stringify(details)}` : ''));
  } finally {
    setIsLoading(false);
  }
};


  const difficulty = watch('difficulty');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-16">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FiChevronLeft className="mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Problem</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {['basic', 'test-cases', 'code'].map(section => (
                <button
                  key={section}
                  className={`px-6 py-4 font-medium text-sm transition-colors ${activeSection === section ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveSection(section)}
                >
                  {section === 'basic' && 'Basic Info'}
                  {section === 'test-cases' && 'Test Cases'}
                  {section === 'code' && 'Code Templates'}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {activeSection === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problem Title</label>
                  <input
                    type="text"
                    {...register('title')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter problem title"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={6}
                    {...register('description')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Describe the problem, including examples and constraints"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      {...register('difficulty')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${difficulty === 'easy' ? 'bg-green-100 text-green-800' : ''}
                        ${difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${difficulty === 'hard' ? 'bg-red-100 text-red-800' : ''}`}>
                        {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      type="text"
                      {...register('tags')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.tags ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="e.g. array, sorting, dynamic-programming"
                    />
                    {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'test-cases' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiEye className="mr-2" /> Visible Test Cases
                    </h3>
                    <button
                      type="button"
                      onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiPlus className="mr-1" /> Add Test Case
                    </button>
                  </div>

                  <div className="space-y-4">
                    {visibleFields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700">Test Case {index + 1}</span>
                          {visibleFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVisible(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Input</label>
                            <textarea
                              rows={3}
                              {...register(`visibleTestCases.${index}.input`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.visibleTestCases?.[index]?.input ? 'border-red-500' : 'border-gray-300'}`}
                              placeholder="Test input"
                            />
                            {errors.visibleTestCases?.[index]?.input && (
                              <p className="mt-1 text-sm text-red-600">{errors.visibleTestCases[index].input.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                            <textarea
                              rows={3}
                              {...register(`visibleTestCases.${index}.output`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.visibleTestCases?.[index]?.output ? 'border-red-500' : 'border-gray-300'}`}
                              placeholder="Expected output"
                            />
                            {errors.visibleTestCases?.[index]?.output && (
                              <p className="mt-1 text-sm text-red-600">{errors.visibleTestCases[index].output.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                          <textarea
                            rows={2}
                            {...register(`visibleTestCases.${index}.explanation`)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.visibleTestCases?.[index]?.explanation ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Explanation of the test case"
                          />
                          {errors.visibleTestCases?.[index]?.explanation && (
                            <p className="mt-1 text-sm text-red-600">{errors.visibleTestCases[index].explanation.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.visibleTestCases && (
                    <p className="mt-2 text-sm text-red-600">{errors.visibleTestCases.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiEyeOff className="mr-2" /> Hidden Test Cases
                    </h3>
                    <button
                      type="button"
                      onClick={() => appendHidden({ input: '', output: '' })}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiPlus className="mr-1" /> Add Test Case
                    </button>
                  </div>

                  <div className="space-y-4">
                    {hiddenFields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-700">Hidden Test Case {index + 1}</span>
                          {hiddenFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHidden(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Input</label>
                            <textarea
                              rows={3}
                              {...register(`hiddenTestCases.${index}.input`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.hiddenTestCases?.[index]?.input ? 'border-red-500' : 'border-gray-300'}`}
                              placeholder="Test input"
                            />
                            {errors.hiddenTestCases?.[index]?.input && (
                              <p className="mt-1 text-sm text-red-600">{errors.hiddenTestCases[index].input.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                            <textarea
                              rows={3}
                              {...register(`hiddenTestCases.${index}.output`)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.hiddenTestCases?.[index]?.output ? 'border-red-500' : 'border-gray-300'}`}
                              placeholder="Expected output"
                            />
                            {errors.hiddenTestCases?.[index]?.output && (
                              <p className="mt-1 text-sm text-red-600">{errors.hiddenTestCases[index].output.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.hiddenTestCases && (
                    <p className="mt-2 text-sm text-red-600">{errors.hiddenTestCases.message}</p>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'code' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiCode className="mr-2" /> Starter Code
                    </h3>
                    <button
                      type="button"
                      onClick={() => appendStartCode({ language: 'c++', initialCode: '' })}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiPlus className="mr-1" /> Add Language
                    </button>
                  </div>

                  <div className="space-y-4">
                    {startCodeFields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <div className="w-48">
                            <select
                              {...register(`startCode.${index}.language`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="c++">C++</option>
                              <option value="java">Java</option>
                              <option value="javascript">JavaScript</option>
                              <option value="python">Python</option>
                            </select>
                          </div>
                          {startCodeFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeStartCode(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Code</label>
                          <textarea
                            rows={8}
                            {...register(`startCode.${index}.initialCode`)}
                            className={`w-full px-3 py-2 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.startCode?.[index]?.initialCode ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Write the starter code for this language"
                          />
                          {errors.startCode?.[index]?.initialCode && (
                            <p className="mt-1 text-sm text-red-600">{errors.startCode[index].initialCode.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.startCode && (
                    <p className="mt-2 text-sm text-red-600">{errors.startCode.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiCpu className="mr-2" /> Reference Solutions
                    </h3>
                    <button
                      type="button"
                      onClick={() => appendRefSolution({ language: 'c++', completeCode: '' })}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiPlus className="mr-1" /> Add Solution
                    </button>
                  </div>

                  <div className="space-y-4">
                    {refSolutionFields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <div className="w-48">
                            <select
                              {...register(`referenceSolution.${index}.language`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="c++">C++</option>
                              <option value="java">Java</option>
                              <option value="javascript">JavaScript</option>
                              <option value="python">Python</option>
                            </select>
                          </div>
                          {refSolutionFields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRefSolution(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Complete Solution</label>
                          <textarea
                            rows={10}
                            {...register(`referenceSolution.${index}.completeCode`)}
                            className={`w-full px-3 py-2 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.referenceSolution?.[index]?.completeCode ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Write the complete solution for this language"
                          />
                          {errors.referenceSolution?.[index]?.completeCode && (
                            <p className="mt-1 text-sm text-red-600">{errors.referenceSolution[index].completeCode.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.referenceSolution && (
                    <p className="mt-2 text-sm text-red-600">{errors.referenceSolution.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 mt-8 border-t border-gray-200">
              <div>
                {activeSection !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'test-cases' ? 'basic' : 'test-cases')}
                    className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Previous
                  </button>
                )}
              </div>

              <div className="flex space-x-3">
                {activeSection !== 'code' && (
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'basic' ? 'test-cases' : 'code')}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                )}

                {activeSection === 'code' && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {isLoading ? 'Creating Problem...' : 'Create Problem'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProblem;