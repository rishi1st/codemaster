import React, { useCallback } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus, FiX, FiCode } from 'react-icons/fi';

const BasicInfoSection = ({ register, errors }) => (
  <div className="space-y-6">
    <div className="border-b border-gray-600 pb-4">
      <h3 className="text-lg font-medium text-white">Basic Information</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
        <input
          {...register('title')}
          className={`w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
            errors.title ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500 border-gray-600'
          } text-white`}
          placeholder="Problem title"
        />
        {errors.title && (
          <p className="mt-2 text-sm text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty *</label>
          <select
            {...register('difficulty')}
            className={`w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
              errors.difficulty ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500 border-gray-600'
            } text-white`}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tag *</label>
          <select
            {...register('tags')}
            className={`w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
              errors.tags ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500 border-gray-600'
            } text-white`}
          >
            <option value="array">Array</option>
            <option value="string">String</option>
            <option value="linkedList">Linked List</option>
            <option value="tree">Tree</option>
            <option value="graph">Graph</option>
            <option value="dp">Dynamic Programming</option>
            <option value="math">Math</option>
            <option value="recursion">Recursion</option>
            <option value="search">Search</option>
            <option value="sorting">Sorting</option>
          </select>
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
      <textarea
        {...register('description')}
        rows={6}
        className={`w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 ${
          errors.description ? 'focus:ring-red-500 border-red-500' : 'focus:ring-blue-500 border-gray-600'
        } text-white`}
        placeholder="Detailed problem description (Markdown supported)"
      />
      {errors.description && (
        <p className="mt-2 text-sm text-red-400">{errors.description.message}</p>
      )}
    </div>
  </div>
);

const TestCasesSection = ({
  visibleFields,
  hiddenFields,
  appendVisible,
  removeVisible,
  appendHidden,
  removeHidden,
  register,
  errors
}) => (
  <div className="space-y-6">
    <div className="border-b border-gray-600 pb-4">
      <h3 className="text-lg font-medium text-white">Test Cases</h3>
    </div>
    
    {/* Visible Test Cases */}
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-300">Visible Test Cases *</h4>
        <button
          type="button"
          onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
          className="flex items-center text-sm text-blue-400 hover:text-blue-300"
        >
          <FiPlus className="mr-1" /> Add Case
        </button>
      </div>
      
      <div className="space-y-4">
        {visibleFields.map((field, index) => (
          <div key={field.id} className="bg-gray-700 rounded-lg p-4 space-y-3 border border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">Case {index + 1}</span>
              {visibleFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVisible(index)}
                  className="text-gray-400 hover:text-red-400 text-sm flex items-center"
                >
                  <FiX className="mr-1" /> Remove
                </button>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Input</label>
              <textarea
                {...register(`visibleTestCases.${index}.input`)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
                placeholder="Input"
              />
              {errors.visibleTestCases?.[index]?.input && (
                <p className="mt-1 text-xs text-red-400">{errors.visibleTestCases[index].input.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Output</label>
              <textarea
                {...register(`visibleTestCases.${index}.output`)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
                placeholder="Output"
              />
              {errors.visibleTestCases?.[index]?.output && (
                <p className="mt-1 text-xs text-red-400">{errors.visibleTestCases[index].output.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Explanation</label>
              <textarea
                {...register(`visibleTestCases.${index}.explanation`)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
                placeholder="Explanation"
              />
              {errors.visibleTestCases?.[index]?.explanation && (
                <p className="mt-1 text-xs text-red-400">{errors.visibleTestCases[index].explanation.message}</p>
              )}
            </div>
          </div>
        ))}
        {errors.visibleTestCases?.message && (
          <p className="text-sm text-red-400">{errors.visibleTestCases.message}</p>
        )}
      </div>
    </div>

    {/* Hidden Test Cases */}
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-300">Hidden Test Cases *</h4>
        <button
          type="button"
          onClick={() => appendHidden({ input: '', output: '' })}
          className="flex items-center text-sm text-blue-400 hover:text-blue-300"
        >
          <FiPlus className="mr-1" /> Add Case
        </button>
      </div>
      
      <div className="space-y-4">
        {hiddenFields.map((field, index) => (
          <div key={field.id} className="bg-gray-700 rounded-lg p-4 space-y-3 border border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-300">Case {index + 1}</span>
              {hiddenFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHidden(index)}
                  className="text-gray-400 hover:text-red-400 text-sm flex items-center"
                >
                  <FiX className="mr-1" /> Remove
                </button>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Input</label>
              <textarea
                {...register(`hiddenTestCases.${index}.input`)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
                placeholder="Input"
              />
              {errors.hiddenTestCases?.[index]?.input && (
                <p className="mt-1 text-xs text-red-400">{errors.hiddenTestCases[index].input.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Output</label>
              <textarea
                {...register(`hiddenTestCases.${index}.output`)}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 text-white"
                placeholder="Output"
              />
              {errors.hiddenTestCases?.[index]?.output && (
                <p className="mt-1 text-xs text-red-400">{errors.hiddenTestCases[index].output.message}</p>
              )}
            </div>
          </div>
        ))}
        {errors.hiddenTestCases?.message && (
          <p className="text-sm text-red-400">{errors.hiddenTestCases.message}</p>
        )}
      </div>
    </div>
  </div>
);

const CodeTemplatesSection = ({
  startCodeFields,
  refSolutionFields,
  removeStartCode,
  removeRefSolution,
  addLanguage,
  getRemainingLanguages,
  register,
  errors
}) => (
  <div className="space-y-6">
    <div className="border-b border-gray-600 pb-4">
      <h3 className="text-lg font-medium text-white">Code Templates</h3>
    </div>
    
    <div className="space-y-6">
      {startCodeFields.map((field, index) => (
        <div key={field.id} className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiCode className="mr-2 text-blue-400" />
              <h4 className="font-medium text-gray-300 capitalize">{field.language}</h4>
            </div>
            {startCodeFields.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  removeStartCode(index);
                  const refIndex = refSolutionFields.findIndex(
                    f => f.language === field.language
                  );
                  if (refIndex !== -1) removeRefSolution(refIndex);
                }}
                className="text-gray-400 hover:text-red-400 text-sm flex items-center"
              >
                <FiX className="mr-1" /> Remove Language
              </button>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Initial Code *</label>
            <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
              <textarea
                {...register(`startCode.${index}.initialCode`)}
                rows={8}
                className="w-full bg-transparent font-mono text-sm focus:outline-none resize-none text-gray-200"
                placeholder={`${field.language} starter code`}
              />
            </div>
            {errors.startCode?.[index]?.initialCode && (
              <p className="mt-1 text-xs text-red-400">{errors.startCode[index].initialCode.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Reference Solution *</label>
            <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
              <textarea
                {...register(`referenceSolution.${index}.completeCode`)}
                rows={8}
                className="w-full bg-transparent font-mono text-sm focus:outline-none resize-none text-gray-200"
                placeholder={`${field.language} solution`}
              />
            </div>
            {errors.referenceSolution?.[index]?.completeCode && (
              <p className="mt-1 text-xs text-red-400">{errors.referenceSolution[index].completeCode.message}</p>
            )}
          </div>
        </div>
      ))}
      
      {getRemainingLanguages().length > 0 && (
        <button
          type="button"
          onClick={addLanguage}
          className="flex items-center text-sm text-blue-400 hover:text-blue-300"
        >
          <FiPlus className="mr-1" /> Add Another Language
        </button>
      )}
    </div>
  </div>
);

const ProblemForm = ({
  isEditMode,
  onSubmit,
  register,
  errors,
  control,
  isLoading,
  availableLanguages = ['c++', 'java', 'javascript', 'python']
}) => {
  // Field arrays
  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({ control, name: 'visibleTestCases' });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({ control, name: 'hiddenTestCases' });

  const {
    fields: startCodeFields,
    append: appendStartCode,
    remove: removeStartCode
  } = useFieldArray({ control, name: 'startCode' });

  const {
    fields: refSolutionFields,
    append: appendRefSolution,
    remove: removeRefSolution
  } = useFieldArray({ control, name: 'referenceSolution' });

  const getRemainingLanguages = useCallback(() => {
    return availableLanguages.filter(
      lang => !startCodeFields.some(field => field.language === lang)
    );
  }, [availableLanguages, startCodeFields]);

  const addLanguage = useCallback(() => {
    const remaining = getRemainingLanguages();
    if (remaining.length > 0) {
      const nextLanguage = remaining[0];
      appendStartCode({ language: nextLanguage, initialCode: '' });
      appendRefSolution({ language: nextLanguage, completeCode: '' });
    }
  }, [appendRefSolution, appendStartCode, getRemainingLanguages]);

  return (
    <div className="bg-gray-750 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6 text-white">
          {isEditMode ? 'Edit Problem' : 'Create New Problem'}
        </h2>
        
        <form onSubmit={onSubmit} className="space-y-8">
          <BasicInfoSection register={register} errors={errors} />
          <TestCasesSection 
            visibleFields={visibleFields}
            hiddenFields={hiddenFields}
            appendVisible={appendVisible}
            removeVisible={removeVisible}
            appendHidden={appendHidden}
            removeHidden={removeHidden}
            register={register}
            errors={errors}
          />
          <CodeTemplatesSection
            startCodeFields={startCodeFields}
            refSolutionFields={refSolutionFields}
            removeStartCode={removeStartCode}
            removeRefSolution={removeRefSolution}
            addLanguage={addLanguage}
            getRemainingLanguages={getRemainingLanguages}
            register={register}
            errors={errors}
          />
          
          <div className="flex justify-end pt-6 border-t border-gray-600">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-70 flex items-center`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {isEditMode ? 'Update Problem' : 'Create Problem'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProblemForm;