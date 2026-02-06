import React, { useState } from 'react';
import { importService } from '../services/importService';
import toast from 'react-hot-toast';
import { FiUpload, FiFile, FiCheckCircle, FiXCircle, FiPackage, FiUsers, FiBarChart2 } from 'react-icons/fi';

const TABS = [
  { id: 'products', label: 'Products (Excel)', icon: FiPackage, accept: '.xlsx,.xls', uploadKey: 'products' },
  { id: 'doctors', label: 'Doctors (Excel)', icon: FiUsers, accept: '.xlsx,.xls', uploadKey: 'doctors' },
  { id: 'sales', label: 'Sales (CSV)', icon: FiBarChart2, accept: '.csv', uploadKey: 'sales' },
];

const CSVUpload = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [file, setFile] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [clearExistingProducts, setClearExistingProducts] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    const tab = TABS.find((t) => t.id === activeTab);
    const isCsv = tab?.accept === '.csv';
    const isExcel = tab?.accept?.includes('.xlsx');
    const valid =
      isCsv
        ? selectedFile.type === 'text/csv' || selectedFile.name.toLowerCase().endsWith('.csv')
        : selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls');
    if (valid) {
      setFile(selectedFile);
      setUploadResult(null);
    } else {
      toast.error(isCsv ? 'Please select a CSV file' : 'Please select an Excel file (.xlsx or .xls)');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      let result;
      if (activeTab === 'products') {
        result = await importService.uploadProductsExcel(file, updateExisting, clearExistingProducts);
      } else if (activeTab === 'doctors') {
        result = await importService.uploadDoctorsExcel(file, updateExisting);
      } else {
        result = await importService.uploadMargERP(file);
      }
      // API returns { success, message, data: { total, created, updated, errors, errorDetails } }
      setUploadResult({ success: true, ...result.data });
      toast.success('Import completed');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Import failed');
      setUploadResult({
        success: false,
        message: error.response?.data?.message || 'Import failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const switchTab = (id) => {
    setActiveTab(id);
    setFile(null);
    setUploadResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Data Import</h1>
        <p className="text-gray-600 mt-2">
          Import products and doctors from Excel, or sales data from CSV
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {currentTab.label}
        </h2>

        {activeTab === 'products' && (
          <label className="flex items-center gap-2 mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={clearExistingProducts}
              onChange={(e) => setClearExistingProducts(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-amber-700">Clear all existing products before import (fresh start)</span>
          </label>
        )}
        {(activeTab === 'products' || activeTab === 'doctors') && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Update existing records (by code / reg no or email)</span>
          </label>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FiUpload className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">
            Select your {activeTab === 'sales' ? 'CSV' : 'Excel'} file
          </p>
          <input
            type="file"
            accept={currentTab.accept}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-block bg-primary text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-600"
          >
            Select File
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiFile className="text-gray-600" size={24} />
              <div>
                <p className="font-medium text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700"
            >
              <FiXCircle size={20} />
            </button>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <FiUpload />
                <span>Import</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Import Results</h2>
          {uploadResult.success !== false ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <FiCheckCircle size={24} />
                <span className="font-semibold">Import completed</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {uploadResult.total ?? 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-2xl font-bold text-green-600">
                    {uploadResult.created ?? 0}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Updated</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {uploadResult.updated ?? 0}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">
                    {uploadResult.errors ?? 0}
                  </p>
                </div>
              </div>
              {uploadResult.errorDetails?.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-700">Error details (first 10)</p>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {uploadResult.errorDetails
                      .slice(0, 10)
                      .map((err, index) => (
                        <p key={index} className="text-xs text-red-600">
                          Row {err.row}: {err.error}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600">
              <FiXCircle size={24} />
              <span>{uploadResult.message || 'Import failed'}</span>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">Product Excel</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>First row = headers</li>
            <li>Required: <strong>Product Name</strong> (e.g. &quot;Name&quot;, &quot;Product Name&quot;) and <strong>MRP</strong> (e.g. &quot;MRP&quot;, &quot;Price&quot;)</li>
            <li>Optional: Code (auto-generated from name if missing), Category, Type, Pack Size, SKU, HSN Code, Description, Composition, Manufacturer</li>
            <li>Type: Tablet, Capsule, Syrup, Injection, Cream, Ointment, Other</li>
          </ul>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">Doctor Excel</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>First row = headers</li>
            <li>Required: <strong>Name</strong>, <strong>Specialization</strong></li>
            <li>Optional: Qualification, Registration No, Phone, Email, Clinic, Address, Area, City, State, Pincode, Category (A/B/C), Notes</li>
          </ul>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">Sales CSV (MARG ERP)</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Columns: Date, MR_Code, Doctor_Code, Product_Code, Quantity, Amount</li>
            <li>Date: YYYY-MM-DD</li>
            <li>Codes must match existing MR, Doctor, and Product data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CSVUpload;
