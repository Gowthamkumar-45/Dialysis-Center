import React, { useState, useEffect } from 'react';
import { Activity, Settings, AlertCircle, CheckCircle2, ShieldAlert, Plus, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { machineService } from '../../services/api';
import MachineModal from './MachineModal';
import './Machines.css';

const Machines = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await machineService.getAll();
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleAdd = () => {
    setSelectedMachine(null);
    setIsModalOpen(true);
  };

  const handleEdit = (machine) => {
    setSelectedMachine(machine);
    setIsModalOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return <CheckCircle2 size={16} />;
      case 'Maintenance': return <AlertCircle size={16} />;
      case 'Cleaning': return <RefreshCw size={16} className="animate-spin" />;
      default: return <Activity size={16} />;
    }
  };

  const getMachineColor = (machine) => {
    if (machine.status === 'Maintenance') return 'rose';
    if (machine.status === 'Cleaning') return 'amber';
    if (machine.type === 'HIV') return 'rose';
    if (machine.status === 'Occupied') return 'emerald';
    return 'blue';
  };

  const updateStatus = async (machine, newStatus) => {
    try {
      await machineService.update(machine.id, { ...machine, status: newStatus });
      fetchMachines();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const renderMachineGroup = (title, description, icon, type, machinesList) => {
    const filtered = machinesList.filter(m => m.type === type);
    
    return (
      <div className="machine-group-section">
        <div className="group-header">
          <div className="group-icon-box">{icon}</div>
          <div className="group-info">
            <h2>{title}</h2>
            <span>{filtered.length} machines · {description}</span>
          </div>
        </div>
        
        <div className="machines-grid-modern">
          {filtered.map((machine) => {
            const color = getMachineColor(machine);
            const prefix = machine.type === 'HIV' ? 'HIV' : 'DM';
            const displayId = `${prefix}-${machine.unit_number.toString().padStart(2, '0')}`;
            
            return (
              <motion.div 
                key={machine.id}
                className="machine-card-premium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="card-top">
                  <div className="unit-label">MACHINE</div>
                  <div className="machine-type-badge">{machine.type}</div>
                </div>
                
                <h3 className="machine-id">{displayId}</h3>
                
                <div className={`status-pill-vibrant ${machine.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {getStatusIcon(machine.status)}
                  <span>{machine.status}</span>
                </div>
                
                <div className="service-info">
                  <Settings size={14} />
                  <span>Date: {machine.last_service_date || 'N/A'}</span>
                </div>
                
                <div className="quick-actions">
                  <button 
                    className={`q-btn ${machine.status === 'In Use' ? 'active in-use' : ''}`}
                    onClick={() => updateStatus(machine, 'In Use')}
                  >
                    IN USE
                  </button>
                  <button 
                    className={`q-btn ${machine.status === 'Maintenance' ? 'active maintenance' : ''}`}
                    onClick={() => updateStatus(machine, 'Maintenance')}
                  >
                    MAINTENANCE
                  </button>
                  <button 
                    className={`q-btn ${machine.status === 'Out of Service' ? 'active out-of-service' : ''}`}
                    onClick={() => updateStatus(machine, 'Out of Service')}
                  >
                    OUT OF SERVICE
                  </button>
                </div>
                
                <button className="configure-link" onClick={() => handleEdit(machine)}>
                  Edit Configuration
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="machines-page">
      <header className="page-header-minimal">
        <div className="header-tag">MACHINE FLOOR</div>
        <div className="header-main">
          <div className="title-group">
            <h1 className="modern-title">Machines</h1>
            <p>Track allocation, isolation status and maintenance for all units.</p>
          </div>
          <button className="add-unit-btn" onClick={handleAdd}>
            <Plus size={18} /> Add New Unit
          </button>
        </div>
      </header>

      <div className="machines-content">
        {loading ? (
          <div className="loading-state">Initializing systems...</div>
        ) : (
          <>
            {renderMachineGroup(
              'HIV-Dedicated Units', 
              'isolated', 
              <ShieldAlert size={20} />, 
              'HIV', 
              machines
            )}
            
            {renderMachineGroup(
              'Standard Dialysis Units', 
              'general allocation', 
              <Activity size={20} />, 
              'Standard', 
              machines
            )}
          </>
        )}
      </div>

      <MachineModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchMachines}
        machine={selectedMachine}
      />
    </div>
  );
};

export default Machines;
