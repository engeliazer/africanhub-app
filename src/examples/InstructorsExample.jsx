import React from 'react';
import { Card, Divider } from 'antd';
import InstructorsDisplay from '../components/public/InstructorsDisplay';

/**
 * Example usage of InstructorsDisplay component
 * This can be used on your public website to display instructors
 */

const InstructorsExample = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Card title="Instructors Display Examples">
        
        {/* Example 1: Full instructors display with title */}
        <div style={{ marginBottom: '40px' }}>
          <h3>Full Instructors Display</h3>
          <InstructorsDisplay 
            title="Meet Our Expert Instructors"
            columns={3}
            showTitle={true}
          />
        </div>

        <Divider />

        {/* Example 2: Limited instructors (show only 2) */}
        <div style={{ marginBottom: '40px' }}>
          <h3>Featured Instructors (Limited)</h3>
          <InstructorsDisplay 
            title="Featured Instructors"
            columns={2}
            maxInstructors={2}
            showTitle={true}
          />
        </div>

        <Divider />

        {/* Example 3: Compact display without title */}
        <div style={{ marginBottom: '40px' }}>
          <h3>Compact Display</h3>
          <InstructorsDisplay 
            columns={4}
            showTitle={false}
          />
        </div>

        <Divider />

        {/* Example 4: Mobile-friendly single column */}
        <div>
          <h3>Mobile-Friendly Display</h3>
          <InstructorsDisplay 
            title="Our Team"
            columns={1}
            showTitle={true}
          />
        </div>

      </Card>
    </div>
  );
};

export default InstructorsExample;

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. For your public website, simply import and use:
 * 
 *    import InstructorsDisplay from './components/public/InstructorsDisplay';
 *    
 *    function HomePage() {
 *      return (
 *        <div>
 *          <h1>Welcome to OCPAC</h1>
 *          <InstructorsDisplay 
 *            title="Our Expert Instructors"
 *            columns={3}
 *          />
 *        </div>
 *      );
 *    }
 * 
 * 2. Props available:
 *    - title: string (default: "Our Instructors")
 *    - showTitle: boolean (default: true)
 *    - columns: number (default: 3) - responsive columns
 *    - maxInstructors: number (default: null) - limit number shown
 * 
 * 3. The component automatically:
 *    - Fetches instructors from your API
 *    - Handles loading states
 *    - Shows error messages if API fails
 *    - Is fully responsive (mobile-friendly)
 *    - Shows instructor photos, names, titles, and bios
 * 
 * 4. Styling:
 *    - Uses Ant Design components
 *    - Fully responsive grid system
 *    - Hover effects on cards
 *    - Professional appearance
 *    - Easy to customize with CSS
 */
