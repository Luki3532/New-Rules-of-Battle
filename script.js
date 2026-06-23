// Hunt Showdown Death Tracker
class DeathTracker {
    constructor() {
        this.profiles = JSON.parse(localStorage.getItem('huntProfiles')) || [];
        this.currentProfile = localStorage.getItem('currentProfile') || null;
        this.myProfileName = 'ME'; // The user's own profile name
        this.isLocked = localStorage.getItem('encountersLocked') !== 'false'; // Default to locked
        this.draggedElement = null;
        this.selectedDeathCauses = []; // Death causes to compare on chart
        this.comparedProfiles = []; // Profiles to compare on chart
        this.kdComparedProfiles = []; // Profiles to compare on K/D chart
        this.defaultCauses = [
            'Maynard Sniper',
            'Rushing in',
            'Double peeked',
            'Bad aim',
            'Someone snuck up',
            'Bad internet',
            'Headshot',
            'Burned alive',
            'AI killed me',
            'Explosive',
            'Melee fight',
            'Team wipe',
            'in bushes',
            'staying still',
            'walking',
            'running',
            'crouching',
            'wrong weapon',
            'red barrel',
            'suicide',
            'boss',
            'zombie light',
            'zombie heavy',
            'pinched',
            'sniped',
            'close quarters',
            'medium range',
            'day time',
            'night time'
        ];
        this.defaultCompounds = [
            'Alain & Son Fish',
            'Alice Farm',
            'Blanchett Graves',
            'Blanc Brinery',
            'Chapel of Madonna Noire',
            'Cyprus Huts',
            'Darrow Livestock',
            'Davant Ranch',
            'Wolfshead Arsenal',
            'Fort Bolden',
            'Godard Docks',
            'Healing Waters Church',
            'Hemlock & Hide',
            'Iron Works',
            'Kingsnake Mine',
            'Lawson Station',
            'Lockbay Docks',
            'Lower DeSalle',
            'Lumber Mill',
            'Maw Battery',
            'Nicholls Prison',
            'Pitching Crematorium',
            'Port Reeker',
            'Reynard Mill & Lumber',
            'Salter\'s Pork',
            'Scupper Lake',
            'Stillwater Bend',
            'The Windy Run',
            'Sweetbell Flour Mill',
            'Wolfshead Arsenal'
        ];
        this.defaultGuns = [
            'Winfield',
            'Sparks',
            'Mosin',
            'Lebel',
            'Vetterli',
            'Martini-Henry',
            'Springfield',
            'Nitro Express',
            'Caldwell Rival',
            'Specter',
            'Crown & King',
            'Romero',
            'Dolch',
            'Uppercut',
            'Pax',
            'Conversion',
            'Nagant',
            'Bornheim',
            'Crossbow',
            'Bow',
            'Bomb Lance',
            'Melee',
            'Unknown'
        ];
        
        // Templates system
        this.templates = JSON.parse(localStorage.getItem('huntTemplates')) || [];
        this.editingTemplateId = null; // Track which template is being edited
        
        // Recent selections tracking (per profile)
        this.recentSelections = { causes: [], guns: [] };
        
        // Correlations for smart predictions (per profile)
        this.correlations = { causes: {}, guns: {} };
        
        this.init();
    }

    init() {
        // If no profiles exist, create a default one
        if (this.profiles.length === 0) {
            this.createProfile('ME');
            this.currentProfile = 'ME';
            this.myProfileName = 'ME';
        }

        // If current profile doesn't exist, set to first profile
        if (!this.currentProfile || !this.profiles.find(p => p.name === this.currentProfile)) {
            this.currentProfile = this.profiles[0].name;
        }

        // Ensure all profiles have kdRecords and gunDeaths
        this.profiles.forEach(profile => {
            if (!profile.kdRecords) {
                profile.kdRecords = [];
            }
            if (!profile.gunDeaths) {
                profile.gunDeaths = [];
            }
            if (!profile.customGuns) {
                profile.customGuns = [];
            }
            if (!profile.gunOrder) {
                profile.gunOrder = [...this.defaultGuns];
            }
            if (!profile.removedGuns) {
                profile.removedGuns = [];
            }
            if (!profile.customCompounds) {
                profile.customCompounds = [];
            }
            if (!profile.compoundOrder) {
                profile.compoundOrder = [...this.defaultCompounds];
            }
            if (!profile.removedCompounds) {
                profile.removedCompounds = [];
            }
            if (!profile.recentSelections) {
                profile.recentSelections = { causes: [], guns: [] };
            }
        });

        // Load recent selections for current profile
        const currentProfileData = this.getCurrentProfile();
        if (currentProfileData && currentProfileData.recentSelections) {
            this.recentSelections = currentProfileData.recentSelections;
        }

        // Calculate correlations from existing death data
        this.calculateCorrelations();

        this.renderProfiles();
        this.renderQuickProfileSwitcher();
        this.renderPlaybook();
        this.renderTemplates();
        this.renderDeathCauses();
        this.renderGuns();
        this.renderCompounds();
        this.updateStats();
        this.renderDeathCauseToggles();
        this.renderProfileCompare();
        this.renderKDProfileCompare();
        this.updateChartVisibility();
        this.renderChart();
        this.renderKDChart();
        this.renderDeathCausePieChart();
        this.renderGunDeathChart();
        this.attachEventListeners();
        this.attachKeyboardShortcuts();
    }

    createProfile(name) {
        const profile = {
            name: name,
            deaths: [],
            customCauses: [],
            causeOrder: [...this.defaultCauses],
            removedCauses: [],
            kdRecords: [], // K/D history
            gunDeaths: [], // Gun death history
            customGuns: [],
            gunOrder: [...this.defaultGuns],
            removedGuns: [],
            customCompounds: [],
            compoundOrder: [...this.defaultCompounds],
            removedCompounds: [],
            recentSelections: { causes: [], guns: [] }, // Recent selections tracking
            created: new Date().toISOString()
        };
        this.profiles.push(profile);
        this.saveData();
    }

    getCurrentProfile() {
        return this.profiles.find(p => p.name === this.currentProfile);
    }

    renderProfiles() {
        const tabsContainer = document.getElementById('profileTabs');
        tabsContainer.innerHTML = '';

        this.profiles.forEach(profile => {
            const tab = document.createElement('div');
            tab.className = 'profile-tab';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = profile.name;
            nameSpan.className = 'profile-name';
            nameSpan.addEventListener('click', () => {
                this.switchProfile(profile.name);
            });
            tab.appendChild(nameSpan);
            
            if (profile.name === this.currentProfile) {
                tab.classList.add('active');
            }
            
            // Add rename button (only for current profile)
            if (profile.name === this.currentProfile) {
                const renameBtn = document.createElement('button');
                renameBtn.className = 'profile-action-btn rename-btn';
                renameBtn.innerHTML = '✎';
                renameBtn.title = 'Rename hunter';
                renameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.renameProfile(profile.name);
                });
                tab.appendChild(renameBtn);
            }
            
            // Add delete button (only if not the last profile and not current)
            if (this.profiles.length > 1 && profile.name !== this.currentProfile) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'profile-action-btn delete-btn';
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete hunter';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteProfile(profile.name);
                });
                tab.appendChild(deleteBtn);
            }
            
            tabsContainer.appendChild(tab);
        });

        // Update current hunter name in form
        document.getElementById('currentHunterName').textContent = this.currentProfile;
        const gunHunterName = document.getElementById('currentHunterNameGun');
        if (gunHunterName) {
            gunHunterName.textContent = this.currentProfile;
        }
    }

    renderQuickProfileSwitcher() {
        const container = document.getElementById('quickProfileSwitcher');
        if (!container) return;

        container.innerHTML = '';

        this.profiles.forEach(profile => {
            const btn = document.createElement('button');
            btn.className = 'quick-profile-btn';
            btn.textContent = profile.name;
            
            if (profile.name === this.currentProfile) {
                btn.classList.add('active');
            }
            
            btn.addEventListener('click', () => {
                this.switchProfile(profile.name);
            });
            
            container.appendChild(btn);
        });
    }

    switchProfile(profileName) {
        this.currentProfile = profileName;
        localStorage.setItem('currentProfile', profileName);
        this.renderProfiles();
        this.renderQuickProfileSwitcher();
        this.renderDeathCauses();
        this.renderGuns();
        this.renderCompounds();
        this.updateStats();
        this.updateChartVisibility();
        this.renderProfileCompare();
        this.renderKDProfileCompare();
        this.renderChart();
        this.renderKDChart();
        this.renderDeathCausePieChart();
        this.renderGunDeathChart();
    }

    deleteProfile(profileName) {
        if (this.profiles.length <= 1) {
            alert('Cannot delete the last hunter!');
            return;
        }
        
        if (profileName === this.currentProfile) {
            alert('Cannot delete the currently active hunter! Switch to another hunter first.');
            return;
        }
        
        // Store profile name for later
        this.profileToDelete = profileName;
        
        // Show modal
        const modal = document.getElementById('deleteModal');
        const message = document.getElementById('deleteMessage');
        message.textContent = `Are you sure you want to delete ${profileName}? This will permanently remove all their death records.`;
        modal.classList.add('active');
    }

    confirmDeleteProfile() {
        if (!this.profileToDelete) return;
        
        this.profiles = this.profiles.filter(p => p.name !== this.profileToDelete);
        this.saveData();
        
        // Remove from compared profiles if present
        this.comparedProfiles = this.comparedProfiles.filter(p => p !== this.profileToDelete);
        
        this.renderProfiles();
        this.renderQuickProfileSwitcher();
        this.renderProfileCompare();
        this.renderChart();
        this.showNotification(`${this.profileToDelete} has been removed from the ledger`);
        
        this.profileToDelete = null;
        document.getElementById('deleteModal').classList.remove('active');
    }

    renameProfile(oldName) {
        // Store old name for later
        this.profileToRename = oldName;
        
        // Show modal
        const modal = document.getElementById('renameModal');
        const input = document.getElementById('renameProfileName');
        input.value = oldName;
        modal.classList.add('active');
        input.focus();
        input.select();
    }

    confirmRenameProfile() {
        if (!this.profileToRename) return;
        
        const newName = document.getElementById('renameProfileName').value.trim();
        if (!newName || newName === '') return;
        
        if (newName === this.profileToRename) {
            document.getElementById('renameModal').classList.remove('active');
            return;
        }
        
        // Check if name already exists
        if (this.profiles.find(p => p.name === newName)) {
            alert('A hunter with this name already exists!');
            return;
        }
        
        const profile = this.profiles.find(p => p.name === this.profileToRename);
        if (profile) {
            profile.name = newName;
            if (this.currentProfile === this.profileToRename) {
                this.currentProfile = newName;
                localStorage.setItem('currentProfile', newName);
            }
            
            // Update compared profiles
            const compareIndex = this.comparedProfiles.indexOf(this.profileToRename);
            if (compareIndex !== -1) {
                this.comparedProfiles[compareIndex] = newName;
            }
            
            this.saveData();
            this.renderProfiles();
            this.renderQuickProfileSwitcher();
            this.renderProfileCompare();
            this.renderChart();
            this.showNotification(`Hunter renamed to ${newName}`);
        }
        
        this.profileToRename = null;
        document.getElementById('renameModal').classList.remove('active');
    }

    renderDeathCauses() {
        const causesContainer = document.getElementById('deathCauses');
        causesContainer.innerHTML = '';

        const profile = this.getCurrentProfile();
        if (!profile.causeOrder) {
            // Initialize cause order with defaults + custom
            profile.causeOrder = [...this.defaultCauses, ...(profile.customCauses || [])];
        }
        if (!profile.removedCauses) {
            profile.removedCauses = [];
        }

        // Get causes in order, excluding removed ones
        const allCauses = profile.causeOrder.filter(cause => !profile.removedCauses.includes(cause));
        const customCauses = profile.customCauses || [];

        // Get recent causes (last 5 unique)
        const recentCauses = profile.recentSelections?.causes ? 
            [...new Set(profile.recentSelections.causes)].slice(0, 5) : [];

        // Render recent causes first if they exist
        if (recentCauses.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'recent-separator';
            separator.innerHTML = '<span>— Recently Used —</span>';
            causesContainer.appendChild(separator);

            recentCauses.forEach((cause, index) => {
                if (!profile.removedCauses.includes(cause)) {
                    this.renderCauseItem(cause, `recent-${index}`, customCauses.includes(cause), true);
                }
            });

            const allSeparator = document.createElement('div');
            allSeparator.className = 'recent-separator';
            allSeparator.innerHTML = '<span>— All Causes —</span>';
            causesContainer.appendChild(allSeparator);
        }

        // Render all causes
        allCauses.forEach((cause, index) => {
            this.renderCauseItem(cause, index, customCauses.includes(cause), false);
        });

        // Update lock button UI
        this.updateLockButton();
    }

    renderCauseItem(cause, index, isCustom, isRecent) {
        const causesContainer = document.getElementById('deathCauses');
        const item = document.createElement('div');
        item.className = 'death-cause-item';
        item.draggable = !this.isLocked;
        item.dataset.cause = cause;
        
        if (!this.isLocked) {
            item.classList.add('unlocked');
        }
        if (isRecent) {
            item.classList.add('recent-item');
        }

        item.innerHTML = `
            ${!this.isLocked ? '<div class="drag-handle" title="Drag to reorder">⋮⋮</div>' : ''}
            ${isRecent ? '<span class="recent-star">⭐</span>' : ''}
            <input type="checkbox" id="cause-${index}" value="${cause}">
            <label for="cause-${index}">${cause}</label>
            ${!this.isLocked ? `<button class="btn-remove-cause" data-cause="${cause}" title="Remove encounter">×</button>` : ''}
        `;
        
        const checkbox = item.querySelector('input');
        
        // Make entire item clickable (not just checkbox)
        item.addEventListener('click', (e) => {
            // Don't toggle if clicking the remove button
            if (e.target.classList.contains('btn-remove-cause')) return;
            if (!this.isLocked && e.target.classList.contains('drag-handle')) return;
            
            checkbox.checked = !checkbox.checked;
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }

            // Update suggestions when selection changes
            this.updateSuggestions();
        });

        // Add delete button listener if unlocked
        if (!this.isLocked) {
            const deleteBtn = item.querySelector('.btn-remove-cause');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.removeCause(cause, isCustom);
                });
            }

            // Add drag and drop listeners
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        }

        causesContainer.appendChild(item);
    }

    updateSuggestions() {
        // Get currently selected causes
        const selectedCauses = [];
        document.querySelectorAll('#deathCauses input[type="checkbox"]:checked').forEach(cb => {
            selectedCauses.push(cb.value);
        });

        // Clear all suggestion indicators
        document.querySelectorAll('.death-cause-item').forEach(item => {
            item.classList.remove('suggested-item');
            const suggestionIcon = item.querySelector('.suggestion-icon');
            if (suggestionIcon) suggestionIcon.remove();
        });

        // Get and apply suggestions
        const suggestions = this.getSuggestions(selectedCauses, 'causes');
        suggestions.forEach(suggestedItem => {
            const item = document.querySelector(`.death-cause-item[data-cause="${suggestedItem}"]`);
            if (item && !item.querySelector('input[type="checkbox"]').checked) {
                item.classList.add('suggested-item');
                if (!item.querySelector('.suggestion-icon')) {
                    const icon = document.createElement('span');
                    icon.className = 'suggestion-icon';
                    icon.textContent = '💡';
                    icon.title = 'Suggested based on your selections';
                    item.querySelector('label').prepend(icon);
                }
            }
        });
    }

    recordDeath() {
        const profile = this.getCurrentProfile();
        if (!profile) return;

        const selectedCauses = Array.from(document.querySelectorAll('.death-cause-item input:checked'))
            .map(cb => cb.value);

        if (selectedCauses.length === 0) {
            alert('Please select at least one cause of death!');
            return;
        }

        const selectedCompound = document.querySelector('#compoundList .death-cause-item input:checked');
        const compound = selectedCompound ? selectedCompound.value : null;

        const notes = document.getElementById('deathNotes').value.trim();

        const death = {
            id: Date.now(),
            causes: selectedCauses,
            compound: compound,
            notes: notes,
            timestamp: new Date().toISOString()
        };

        profile.deaths.unshift(death);
        this.saveData();

        // Track recent selections
        if (!profile.recentSelections) {
            profile.recentSelections = { causes: [], guns: [] };
        }
        
        // Add selected causes to recent (keep last 20)
        selectedCauses.forEach(cause => {
            profile.recentSelections.causes = [
                cause,
                ...profile.recentSelections.causes.filter(c => c !== cause)
            ].slice(0, 20);
        });

        // Save updated recent selections
        this.recentSelections = profile.recentSelections;
        this.saveData();

        // Recalculate correlations with new death data
        this.calculateCorrelations();

        // Clear form
        document.querySelectorAll('.death-cause-item input:checked').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item').classList.remove('selected');
        });
        document.querySelectorAll('#compoundList .death-cause-item input:checked').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item').classList.remove('selected');
        });
        document.getElementById('deathNotes').value = '';

        // Clear suggestions
        document.querySelectorAll('.suggested-item').forEach(item => {
            item.classList.remove('suggested-item');
            const icon = item.querySelector('.suggestion-icon');
            if (icon) icon.remove();
        });

        // Update UI
        this.updateStats();
        this.renderChart();
        this.renderDeathCausePieChart();
        this.renderGunDeathChart();
        this.renderDeathCauses(); // Re-render to update recent selections
        this.renderGuns(); // Re-render to update recent selections

        // Show confirmation
        this.showNotification('Death recorded in the ledger');
    }

    addCustomCause() {
        const input = document.getElementById('customCause');
        const cause = input.value.trim();

        if (!cause) {
            alert('Please enter a cause of death!');
            return;
        }

        const profile = this.getCurrentProfile();
        if (!profile.customCauses) {
            profile.customCauses = [];
        }
        if (!profile.causeOrder) {
            profile.causeOrder = [...this.defaultCauses, ...profile.customCauses];
        }

        // Check if already exists in custom causes or default causes
        if (profile.customCauses.includes(cause) || this.defaultCauses.includes(cause)) {
            alert('This encounter already exists!');
            return;
        }

        // Check if it was previously removed
        if (profile.removedCauses && profile.removedCauses.includes(cause)) {
            alert('This encounter was previously removed. Cannot re-add with same name.');
            return;
        }

        profile.customCauses.push(cause);
        profile.causeOrder.push(cause);
        this.saveData();
        input.value = '';

        this.renderDeathCauses();
        this.showNotification('Custom encounter added');
    }

    removeCause(cause, isCustom) {
        const message = isCustom 
            ? `Remove "${cause}" from your encounters?\n\nThis will delete the custom encounter.\nExisting death records will NOT be affected.`
            : `Hide "${cause}" from encounters?\n\nYou can restore it later from settings.\nExisting death records will NOT be affected.`;

        if (!confirm(message)) {
            return;
        }

        const profile = this.getCurrentProfile();
        
        if (isCustom) {
            // Remove from custom causes
            profile.customCauses = profile.customCauses.filter(c => c !== cause);
        }
        
        // Add to removed causes list
        if (!profile.removedCauses) {
            profile.removedCauses = [];
        }
        if (!profile.removedCauses.includes(cause)) {
            profile.removedCauses.push(cause);
        }
        
        // Remove from cause order
        if (profile.causeOrder) {
            profile.causeOrder = profile.causeOrder.filter(c => c !== cause);
        }
        
        this.saveData();
        this.renderDeathCauses();
        this.showNotification(isCustom ? 'Custom encounter removed' : 'Encounter hidden');
    }

    toggleLock() {
        this.isLocked = !this.isLocked;
        localStorage.setItem('encountersLocked', this.isLocked);
        this.renderDeathCauses();
        this.showNotification(this.isLocked ? 'Encounters locked' : 'Encounters unlocked - You can now edit');
    }

    updateLockButton() {
        const lockBtn = document.getElementById('lockEncountersBtn');
        if (lockBtn) {
            // SVG lock/unlock icons
            const lockIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 0 0-3 3v2H3.5A1.5 1.5 0 0 0 2 7.5v6A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12.5 6H11V4a3 3 0 0 0-3-3zm2 5V4a2 2 0 1 0-4 0v2h4z"/></svg>`;
            const unlockIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 0 1 3 3v2h1.5A1.5 1.5 0 0 1 14 7.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-6A1.5 1.5 0 0 1 3.5 6H10V4a2 2 0 1 0-4 0v.5a.5.5 0 0 1-1 0V4a3 3 0 0 1 3-3z"/></svg>`;
            
            lockBtn.innerHTML = this.isLocked 
                ? lockIcon + ' Locked' 
                : unlockIcon + ' Unlocked';
            lockBtn.classList.toggle('unlocked', !this.isLocked);
            lockBtn.title = this.isLocked ? 'Click to unlock and edit encounters' : 'Click to lock encounters';
        }
    }

    handleDragStart(e) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('.death-cause-item');
        if (target && target !== this.draggedElement) {
            target.classList.add('drag-over');
        }
        
        return false;
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        const target = e.target.closest('.death-cause-item');
        if (this.draggedElement !== target && target) {
            // Get the causes
            const draggedCause = this.draggedElement.dataset.cause;
            const targetCause = target.dataset.cause;
            
            // Update order in profile
            const profile = this.getCurrentProfile();
            const draggedIndex = profile.causeOrder.indexOf(draggedCause);
            const targetIndex = profile.causeOrder.indexOf(targetCause);
            
            // Remove dragged item and insert at new position
            profile.causeOrder.splice(draggedIndex, 1);
            const newTargetIndex = profile.causeOrder.indexOf(targetCause);
            profile.causeOrder.splice(newTargetIndex, 0, draggedCause);
            
            this.saveData();
            this.renderDeathCauses();
        }

        target?.classList.remove('drag-over');
        return false;
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.death-cause-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    updateStats() {
        const profile = this.getCurrentProfile();
        if (!profile) return;

        // Total deaths
        document.getElementById('totalDeaths').textContent = profile.deaths.length;

        // Death streak
        document.getElementById('deathStreak').textContent = profile.deaths.length;

        // Most common cause
        if (profile.deaths.length > 0) {
            const causeCounts = {};
            profile.deaths.forEach(death => {
                death.causes.forEach(cause => {
                    causeCounts[cause] = (causeCounts[cause] || 0) + 1;
                });
            });

            const topCause = Object.entries(causeCounts)
                .sort((a, b) => b[1] - a[1])[0];
            
            document.getElementById('topCause').textContent = topCause ? topCause[0] : 'None';
        } else {
            document.getElementById('topCause').textContent = 'None';
        }
    }

    updateChartVisibility() {
        const chartSection = document.getElementById('deathChartSection');
        // Only show death chart when viewing own profile
        if (this.currentProfile === this.myProfileName) {
            chartSection.style.display = 'block';
        } else {
            chartSection.style.display = 'none';
        }
    }

    renderDeathCauseToggles() {
        const container = document.getElementById('deathCauseToggles');
        if (!container) return;

        const profile = this.getCurrentProfile();
        if (!profile) return;

        const allCauses = [...this.defaultCauses, ...(profile.customCauses || [])];
        
        container.innerHTML = '';
        
        // Add "Select All" toggle
        const selectAllToggle = document.createElement('label');
        selectAllToggle.className = 'death-cause-toggle select-all-toggle';
        const allSelected = allCauses.length > 0 && allCauses.every(cause => this.selectedDeathCauses.includes(cause));
        if (allSelected) {
            selectAllToggle.classList.add('active');
        }
        
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.checked = allSelected;
        selectAllCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Select all causes
                this.selectedDeathCauses = [...allCauses];
            } else {
                // Deselect all causes
                this.selectedDeathCauses = [];
            }
            this.renderDeathCauseToggles();
            this.renderChart();
        });
        
        const selectAllSpan = document.createElement('span');
        selectAllSpan.textContent = 'Select All';
        selectAllSpan.style.fontWeight = 'bold';
        
        selectAllToggle.appendChild(selectAllCheckbox);
        selectAllToggle.appendChild(selectAllSpan);
        container.appendChild(selectAllToggle);
        
        // Add individual death cause toggles
        allCauses.forEach(cause => {
            const toggle = document.createElement('label');
            toggle.className = 'death-cause-toggle';
            if (this.selectedDeathCauses.includes(cause)) {
                toggle.classList.add('active');
            }
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = this.selectedDeathCauses.includes(cause);
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!this.selectedDeathCauses.includes(cause)) {
                        this.selectedDeathCauses.push(cause);
                    }
                } else {
                    this.selectedDeathCauses = this.selectedDeathCauses.filter(c => c !== cause);
                }
                this.renderDeathCauseToggles();
                this.renderChart();
            });
            
            const span = document.createElement('span');
            span.textContent = cause;
            
            toggle.appendChild(checkbox);
            toggle.appendChild(span);
            container.appendChild(toggle);
        });
    }

    recordKD() {
        const profile = this.getCurrentProfile();
        if (!profile) return;

        const kdInput = document.getElementById('kdRatio').value.trim();
        const ratio = parseFloat(kdInput);
        
        // Validate input
        if (isNaN(ratio) || ratio < 0) {
            this.showNotification('Please enter a valid K/D ratio (e.g., 1.00, 2.5, 0.85)', true);
            return;
        }

        const kdRecord = {
            id: Date.now(),
            ratio: ratio.toFixed(2),
            timestamp: new Date().toISOString()
        };

        if (!profile.kdRecords) {
            profile.kdRecords = [];
        }

        profile.kdRecords.unshift(kdRecord);
        this.saveData();

        // Clear form
        document.getElementById('kdRatio').value = '1.00';

        // Update UI
        this.renderKDChart();
        this.showNotification(`K/D ${kdRecord.ratio} recorded for ${profile.name}`);
    }

    getKDData(profileName, days) {
        const profile = this.profiles.find(p => p.name === profileName);
        if (!profile || !profile.kdRecords) return [];

        const result = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            // Get all K/D records for this day
            const dayRecords = profile.kdRecords.filter(kd => {
                const kdDate = new Date(kd.timestamp);
                return kdDate >= date && kdDate < nextDate;
            });
            
            // Calculate average K/D for the day
            let avgKD = 0;
            if (dayRecords.length > 0) {
                const totalKD = dayRecords.reduce((sum, kd) => sum + parseFloat(kd.ratio), 0);
                avgKD = totalKD / dayRecords.length;
            }
            
            result.push({ date, ratio: avgKD });
        }
        
        return result;
    }

    renderKDProfileCompare() {
        const container = document.getElementById('kdProfileCompare');
        if (!container) return;

        container.innerHTML = '';

        this.profiles.forEach(profile => {
            const isCurrentProfile = profile.name === this.currentProfile;
            
            const label = document.createElement('label');
            label.className = 'profile-compare-item';
            if (isCurrentProfile) {
                label.classList.add('current-profile');
            }
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.disabled = isCurrentProfile;
            checkbox.checked = isCurrentProfile || this.kdComparedProfiles.includes(profile.name);
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!this.kdComparedProfiles.includes(profile.name)) {
                        this.kdComparedProfiles.push(profile.name);
                    }
                } else {
                    this.kdComparedProfiles = this.kdComparedProfiles.filter(p => p !== profile.name);
                }
                this.renderKDChart();
            });
            
            const span = document.createElement('span');
            span.textContent = profile.name + (isCurrentProfile ? ' (Current)' : '');
            
            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });
    }

    renderKDChart() {
        const canvas = document.getElementById('kdChart');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 350;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 50;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2 - 40; // Extra space for legend

        // Get profiles to display
        const currentProfileName = this.currentProfile;
        const profilesToShow = [currentProfileName, ...this.kdComparedProfiles].filter(p => p);
        
        if (profilesToShow.length === 0) {
            ctx.fillStyle = '#a8967a';
            ctx.font = '16px Almendra, serif';
            ctx.textAlign = 'center';
            ctx.fillText('No profile selected', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Profile colors
        const profileColors = [
            { line: '#c4a572', point: '#d4af37' },
            { line: '#8b2e1f', point: '#a53a25' },
            { line: '#4a7c59', point: '#5a9c6f' },
            { line: '#6b5b95', point: '#8b7bb5' },
            { line: '#d4a574', point: '#e4b584' },
        ];

        // Collect all data
        const allSeriesData = [];
        let maxValue = 3; // Minimum scale

        profilesToShow.forEach((profileName, profileIndex) => {
            const data = this.getKDData(profileName, 30);
            if (data.length === 0) return;

            const color = profileColors[profileIndex % profileColors.length];

            allSeriesData.push({
                label: `${profileName} K/D`,
                data: data,
                color: color,
                showPoints: true
            });
            
            maxValue = Math.max(maxValue, ...data.map(d => d.ratio));
        });

        if (allSeriesData.length === 0) {
            ctx.fillStyle = '#a8967a';
            ctx.font = '16px Almendra, serif';
            ctx.textAlign = 'center';
            ctx.fillText('No K/D data recorded yet', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Round up maxValue to nearest 0.5
        maxValue = Math.ceil(maxValue * 2) / 2;

        // Draw axes
        ctx.strokeStyle = '#4a3f2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding - 40);
        ctx.lineTo(canvas.width - padding, canvas.height - padding - 40);
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = '#2a2419';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight * i) / 5;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        const pointSpacing = chartWidth / 29;

        // Draw each series
        allSeriesData.forEach(series => {
            const data = series.data;
            
            // Draw line
            ctx.strokeStyle = series.color.line;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([]);
            
            ctx.beginPath();
            data.forEach((point, index) => {
                const x = padding + index * pointSpacing;
                const y = canvas.height - padding - 40 - (point.ratio / maxValue) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Draw points
            if (series.showPoints) {
                data.forEach((point, index) => {
                    if (point.ratio > 0) {
                        const x = padding + index * pointSpacing;
                        const y = canvas.height - padding - 40 - (point.ratio / maxValue) * chartHeight;

                        ctx.fillStyle = series.color.point;
                        ctx.beginPath();
                        ctx.arc(x, y, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }
        });

        // Draw labels
        ctx.fillStyle = '#a8967a';
        ctx.font = '11px Almendra, serif';
        ctx.textAlign = 'center';

        // X-axis labels (every 5 days)
        const firstDayData = allSeriesData[0].data;
        for (let i = 0; i < firstDayData.length; i += 5) {
            const x = padding + i * pointSpacing;
            const dateStr = firstDayData[i].date.getDate();
            ctx.fillText(dateStr, x, canvas.height - padding - 20);
        }

        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = ((maxValue / 5) * i).toFixed(1);
            const y = canvas.height - padding - 40 - (chartHeight * i) / 5;
            ctx.fillText(value, padding - 10, y + 4);
        }

        // Draw legend
        const legendY = canvas.height - 30;
        let legendX = padding;
        ctx.font = '11px Almendra, serif';
        ctx.textAlign = 'left';

        allSeriesData.forEach((series) => {
            // Draw line sample
            ctx.strokeStyle = series.color.line;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(legendX, legendY);
            ctx.lineTo(legendX + 20, legendY);
            ctx.stroke();

            // Draw text
            ctx.fillStyle = '#a8967a';
            ctx.fillText(series.label, legendX + 25, legendY + 4);

            legendX += ctx.measureText(series.label).width + 40;
        });
    }

    renderProfileCompare() {
        const container = document.getElementById('profileCompare');
        if (!container) return;

        container.innerHTML = '';

        this.profiles.forEach(profile => {
            const isCurrentProfile = profile.name === this.currentProfile;
            const isCompared = this.comparedProfiles.includes(profile.name);
            
            const label = document.createElement('label');
            label.className = 'metric-toggle';
            if (isCurrentProfile) label.classList.add('current-profile');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isCompared;
            checkbox.disabled = isCurrentProfile;
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.comparedProfiles.push(profile.name);
                } else {
                    this.comparedProfiles = this.comparedProfiles.filter(p => p !== profile.name);
                }
                this.renderChart();
            });
            
            const span = document.createElement('span');
            span.textContent = profile.name + (isCurrentProfile ? ' (Current)' : '');
            
            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });
    }

    getProfileData(profileName, days = 30) {
        const profile = this.profiles.find(p => p.name === profileName);
        if (!profile) return [];

        const dataPoints = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const count = profile.deaths.filter(death => {
                const deathDate = new Date(death.timestamp);
                deathDate.setHours(0, 0, 0, 0);
                return deathDate.getTime() === date.getTime();
            }).length;

            dataPoints.push({ date, count });
        }

        return dataPoints;
    }

    calculateMovingAverage(data, window = 7) {
        return data.map((point, index) => {
            const start = Math.max(0, index - window + 1);
            const slice = data.slice(start, index + 1);
            const sum = slice.reduce((acc, p) => acc + p.count, 0);
            return {
                date: point.date,
                count: sum / slice.length
            };
        });
    }

    calculateCumulative(data) {
        let cumulative = 0;
        return data.map(point => {
            cumulative += point.count;
            return {
                date: point.date,
                count: cumulative
            };
        });
    }

    getDeathCauseData(profileName, cause, days) {
        const profile = this.profiles.find(p => p.name === profileName);
        if (!profile) return [];

        const result = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const count = profile.deaths.filter(death => {
                const deathDate = new Date(death.timestamp);
                deathDate.setHours(0, 0, 0, 0);
                return deathDate.getTime() === date.getTime() && death.causes.includes(cause);
            }).length;

            result.push({ date, count });
        }
        
        return result;
    }

    // ===== GUN TRACKING METHODS =====

    renderGuns() {
        const gunsContainer = document.getElementById('gunList');
        if (!gunsContainer) return;
        
        gunsContainer.innerHTML = '';

        const profile = this.getCurrentProfile();
        if (!profile.gunOrder) {
            profile.gunOrder = [...this.defaultGuns, ...(profile.customGuns || [])];
        }
        if (!profile.removedGuns) {
            profile.removedGuns = [];
        }

        const isGunsLocked = localStorage.getItem('gunsLocked') !== 'false';
        const allGuns = profile.gunOrder.filter(gun => !profile.removedGuns.includes(gun));
        const customGuns = profile.customGuns || [];

        // Get recent guns (last 5 unique)
        const recentGuns = profile.recentSelections?.guns ? 
            [...new Set(profile.recentSelections.guns)].slice(0, 5) : [];

        // Render recent guns first if they exist
        if (recentGuns.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'recent-separator';
            separator.innerHTML = '<span>— Recently Used —</span>';
            gunsContainer.appendChild(separator);

            recentGuns.forEach((gun, index) => {
                if (!profile.removedGuns.includes(gun)) {
                    this.renderGunItem(gun, `recent-${index}`, customGuns.includes(gun), true, isGunsLocked);
                }
            });

            const allSeparator = document.createElement('div');
            allSeparator.className = 'recent-separator';
            allSeparator.innerHTML = '<span>— All Guns —</span>';
            gunsContainer.appendChild(allSeparator);
        }

        // Render all guns
        allGuns.forEach((gun, index) => {
            this.renderGunItem(gun, index, customGuns.includes(gun), false, isGunsLocked);
        });

        this.updateGunsLockButton();
    }

    renderGunItem(gun, index, isCustom, isRecent, isGunsLocked) {
        const gunsContainer = document.getElementById('gunList');
        const item = document.createElement('div');
        item.className = 'death-cause-item';
        item.draggable = !isGunsLocked;
        item.dataset.gun = gun;
        
        if (!isGunsLocked) {
            item.classList.add('unlocked');
        }
        if (isRecent) {
            item.classList.add('recent-item');
        }

        item.innerHTML = `
            ${!isGunsLocked ? '<div class="drag-handle" title="Drag to reorder">⋮⋮</div>' : ''}
            ${isRecent ? '<span class="recent-star">⭐</span>' : ''}
            <input type="checkbox" id="gun-${index}" value="${gun}">
            <label for="gun-${index}">${gun}</label>
            ${!isGunsLocked ? `<button class="btn-remove-cause" data-gun="${gun}" title="Remove gun">×</button>` : ''}
        `;
        
        const checkbox = item.querySelector('input');
        
        // Make entire item clickable
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-cause')) return;
            if (!isGunsLocked && e.target.classList.contains('drag-handle')) return;
            
            checkbox.checked = !checkbox.checked;
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }

            // Update suggestions when selection changes
            this.updateSuggestions();
        });

        if (!isGunsLocked) {
            const deleteBtn = item.querySelector('.btn-remove-cause');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.removeGun(gun, isCustom);
                });
            }

            item.addEventListener('dragstart', (e) => this.handleGunDragStart(e));
            item.addEventListener('dragover', (e) => this.handleGunDragOver(e));
            item.addEventListener('drop', (e) => this.handleGunDrop(e));
            item.addEventListener('dragend', (e) => this.handleGunDragEnd(e));
        }

        gunsContainer.appendChild(item);
    }


    recordGunDeath() {
        const profile = this.getCurrentProfile();
        if (!profile) return;

        const selectedGuns = Array.from(document.querySelectorAll('#gunList .death-cause-item input:checked'))
            .map(cb => cb.value);

        if (selectedGuns.length === 0) {
            alert('Please select at least one gun!');
            return;
        }

        const gunDeath = {
            id: Date.now(),
            guns: selectedGuns,
            timestamp: new Date().toISOString()
        };

        if (!profile.gunDeaths) {
            profile.gunDeaths = [];
        }
        profile.gunDeaths.unshift(gunDeath);
        this.saveData();

        // Track recent gun selections
        if (!profile.recentSelections) {
            profile.recentSelections = { causes: [], guns: [] };
        }
        
        // Add selected guns to recent (keep last 20)
        selectedGuns.forEach(gun => {
            profile.recentSelections.guns = [
                gun,
                ...profile.recentSelections.guns.filter(g => g !== gun)
            ].slice(0, 20);
        });

        // Save updated recent selections
        this.recentSelections = profile.recentSelections;
        this.saveData();

        // Clear form
        document.querySelectorAll('#gunList .death-cause-item input:checked').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item').classList.remove('selected');
        });

        // Clear suggestions
        document.querySelectorAll('.suggested-item').forEach(item => {
            item.classList.remove('suggested-item');
            const icon = item.querySelector('.suggestion-icon');
            if (icon) icon.remove();
        });

        // Re-render to update recent selections
        this.renderGuns();

        this.showNotification('Gun death recorded');
    }

    addCustomGun() {
        const input = document.getElementById('customGun');
        const gun = input.value.trim();

        if (!gun) {
            alert('Please enter a gun name!');
            return;
        }

        const profile = this.getCurrentProfile();
        if (!profile.customGuns) {
            profile.customGuns = [];
        }
        if (!profile.gunOrder) {
            profile.gunOrder = [...this.defaultGuns, ...profile.customGuns];
        }

        if (profile.customGuns.includes(gun) || this.defaultGuns.includes(gun)) {
            alert('This gun already exists!');
            return;
        }

        if (profile.removedGuns && profile.removedGuns.includes(gun)) {
            alert('This gun was previously removed. Cannot re-add with same name.');
            return;
        }

        profile.customGuns.push(gun);
        profile.gunOrder.push(gun);
        this.saveData();
        input.value = '';

        this.renderGuns();
        this.showNotification('Custom gun added');
    }

    removeGun(gun, isCustom) {
        const message = isCustom 
            ? `Remove "${gun}" from your gun list?\n\nThis will delete the custom gun.\nExisting records will NOT be affected.`
            : `Hide "${gun}" from gun list?\n\nYou can restore it later.\nExisting records will NOT be affected.`;

        if (!confirm(message)) {
            return;
        }

        const profile = this.getCurrentProfile();
        
        if (isCustom) {
            profile.customGuns = profile.customGuns.filter(g => g !== gun);
        }
        
        if (!profile.removedGuns) {
            profile.removedGuns = [];
        }
        if (!profile.removedGuns.includes(gun)) {
            profile.removedGuns.push(gun);
        }
        
        if (profile.gunOrder) {
            profile.gunOrder = profile.gunOrder.filter(g => g !== gun);
        }
        
        this.saveData();
        this.renderGuns();
        this.showNotification(isCustom ? 'Custom gun removed' : 'Gun hidden');
    }

    toggleGunsLock() {
        const isLocked = localStorage.getItem('gunsLocked') !== 'false';
        localStorage.setItem('gunsLocked', !isLocked);
        this.renderGuns();
        this.showNotification(!isLocked ? 'Guns locked' : 'Guns unlocked - You can now edit');
    }

    updateGunsLockButton() {
        const lockBtn = document.getElementById('lockGunsBtn');
        if (lockBtn) {
            const isLocked = localStorage.getItem('gunsLocked') !== 'false';
            const lockIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 0 0-3 3v2H3.5A1.5 1.5 0 0 0 2 7.5v6A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12.5 6H11V4a3 3 0 0 0-3-3zm2 5V4a2 2 0 1 0-4 0v2h4z"/></svg>`;
            const unlockIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 0 1 3 3v2h1.5A1.5 1.5 0 0 1 14 7.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-6A1.5 1.5 0 0 1 3.5 6H10V4a2 2 0 1 0-4 0v.5a.5.5 0 0 1-1 0V4a3 3 0 0 1 3-3z"/></svg>`;
            
            lockBtn.innerHTML = isLocked 
                ? lockIcon + ' Locked' 
                : unlockIcon + ' Unlocked';
            lockBtn.classList.toggle('unlocked', !isLocked);
            lockBtn.title = isLocked ? 'Click to unlock and edit guns' : 'Click to lock guns';
        }
    }

    handleGunDragStart(e) {
        this.draggedGunElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    handleGunDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('.death-cause-item');
        if (target && target !== this.draggedGunElement) {
            target.classList.add('drag-over');
        }
        
        return false;
    }

    handleGunDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        const target = e.target.closest('.death-cause-item');
        if (this.draggedGunElement !== target && target) {
            const draggedGun = this.draggedGunElement.dataset.gun;
            const targetGun = target.dataset.gun;
            
            const profile = this.getCurrentProfile();
            const draggedIndex = profile.gunOrder.indexOf(draggedGun);
            const targetIndex = profile.gunOrder.indexOf(targetGun);
            
            profile.gunOrder.splice(draggedIndex, 1);
            const newTargetIndex = profile.gunOrder.indexOf(targetGun);
            profile.gunOrder.splice(newTargetIndex, 0, draggedGun);
            
            this.saveData();
            this.renderGuns();
        }

        target?.classList.remove('drag-over');
        return false;
    }

    handleGunDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('#gunList .death-cause-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    // ===== PLAYBOOK METHODS =====

    renderPlaybook() {
        const container = document.getElementById('commandmentsList');
        if (!container) return;

        const playbook = JSON.parse(localStorage.getItem('huntPlaybook')) || [];
        container.innerHTML = '';

        if (playbook.length === 0 || playbook.every(cmd => !cmd)) {
            container.innerHTML = '<li class="empty-commandment">No commandments set. Click the book icon to add your rules.</li>';
            return;
        }

        playbook.forEach((commandment, index) => {
            if (commandment && commandment.trim()) {
                const li = document.createElement('li');
                li.textContent = commandment;
                container.appendChild(li);
            }
        });
    }

    savePlaybook() {
        const playbook = [];
        for (let i = 1; i <= 10; i++) {
            const input = document.getElementById(`commandment${i}`);
            playbook.push(input ? input.value.trim() : '');
        }
        localStorage.setItem('huntPlaybook', JSON.stringify(playbook));
        this.renderPlaybook();
        this.showNotification('Commandments saved');
    }

    openPlaybook() {
        const playbook = JSON.parse(localStorage.getItem('huntPlaybook')) || [];
        for (let i = 1; i <= 10; i++) {
            const input = document.getElementById(`commandment${i}`);
            if (input) {
                input.value = playbook[i - 1] || '';
            }
        }
        document.getElementById('playbookModal').classList.add('active');
        document.getElementById('commandment1')?.focus();
    }

    // ===== COMPOUND TRACKING METHODS =====

    renderCompounds() {
        const compoundsContainer = document.getElementById('compoundList');
        if (!compoundsContainer) return;
        
        compoundsContainer.innerHTML = '';

        const profile = this.getCurrentProfile();
        if (!profile.compoundOrder) {
            profile.compoundOrder = [...this.defaultCompounds, ...(profile.customCompounds || [])];
        }
        if (!profile.removedCompounds) {
            profile.removedCompounds = [];
        }

        const isCompoundsLocked = localStorage.getItem('compoundsLocked') !== 'false';
        const allCompounds = profile.compoundOrder.filter(compound => !profile.removedCompounds.includes(compound));
        const customCompounds = profile.customCompounds || [];

        allCompounds.forEach((compound, index) => {
            const isCustom = customCompounds.includes(compound);
            const item = document.createElement('div');
            item.className = 'death-cause-item';
            item.draggable = !isCompoundsLocked;
            item.dataset.compound = compound;
            
            if (!isCompoundsLocked) {
                item.classList.add('unlocked');
            }

            // Use radio buttons for single selection
            item.innerHTML = `
                ${!isCompoundsLocked ? '<div class="drag-handle" title="Drag to reorder">⋮⋮</div>' : ''}
                <input type="radio" name="compound" id="compound-${index}" value="${compound}">
                <label for="compound-${index}">${compound}</label>
                ${!isCompoundsLocked ? `<button class="btn-remove-cause" data-compound="${compound}" title="Remove compound">×</button>` : ''}
            `;
            
            const radio = item.querySelector('input');
            
            // Make entire item clickable
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-remove-cause')) return;
                if (!isCompoundsLocked && e.target.classList.contains('drag-handle')) return;
                
                radio.checked = true;
                // Remove selected class from all items
                document.querySelectorAll('#compoundList .death-cause-item').forEach(i => i.classList.remove('selected'));
                // Add selected class to this item
                item.classList.add('selected');
            });

            if (!isCompoundsLocked) {
                const deleteBtn = item.querySelector('.btn-remove-cause');
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.removeCompound(compound, isCustom);
                });

                item.addEventListener('dragstart', (e) => this.handleCompoundDragStart(e));
                item.addEventListener('dragover', (e) => this.handleCompoundDragOver(e));
                item.addEventListener('dragdrop', (e) => this.handleCompoundDrop(e));
                item.addEventListener('dragend', (e) => this.handleCompoundDragEnd(e));
            }

            compoundsContainer.appendChild(item);
        });

        this.updateCompoundsLockButton();
    }

    addCustomCompound() {
        const input = document.getElementById('customCompound');
        const compound = input.value.trim();

        if (!compound) {
            alert('Please enter a location name!');
            return;
        }

        const profile = this.getCurrentProfile();
        if (!profile.customCompounds) {
            profile.customCompounds = [];
        }
        if (!profile.compoundOrder) {
            profile.compoundOrder = [...this.defaultCompounds, ...profile.customCompounds];
        }

        if (profile.customCompounds.includes(compound) || this.defaultCompounds.includes(compound)) {
            alert('This location already exists!');
            return;
        }

        if (profile.removedCompounds && profile.removedCompounds.includes(compound)) {
            alert('This location was previously removed. Cannot re-add with same name.');
            return;
        }

        profile.customCompounds.push(compound);
        profile.compoundOrder.push(compound);
        this.saveData();
        input.value = '';

        this.renderCompounds();
        this.showNotification('Custom location added');
    }

    removeCompound(compound, isCustom) {
        const message = isCustom 
            ? `Remove "${compound}" from your locations?\n\nThis will delete the custom location.\nExisting records will NOT be affected.`
            : `Hide "${compound}" from locations?\n\nYou can restore it later.\nExisting records will NOT be affected.`;

        if (!confirm(message)) {
            return;
        }

        const profile = this.getCurrentProfile();
        
        if (isCustom) {
            profile.customCompounds = profile.customCompounds.filter(c => c !== compound);
        }
        
        if (!profile.removedCompounds) {
            profile.removedCompounds = [];
        }
        if (!profile.removedCompounds.includes(compound)) {
            profile.removedCompounds.push(compound);
        }
        
        if (profile.compoundOrder) {
            profile.compoundOrder = profile.compoundOrder.filter(c => c !== compound);
        }
        
        this.saveData();
        this.renderCompounds();
        this.showNotification(isCustom ? 'Custom location removed' : 'Location hidden');
    }

    toggleCompoundsLock() {
        const isLocked = localStorage.getItem('compoundsLocked') !== 'false';
        localStorage.setItem('compoundsLocked', !isLocked);
        this.renderCompounds();
        this.showNotification(!isLocked ? 'Locations locked' : 'Locations unlocked - You can now edit');
    }

    updateCompoundsLockButton() {
        const lockBtn = document.getElementById('lockCompoundsBtn');
        if (lockBtn) {
            const isLocked = localStorage.getItem('compoundsLocked') !== 'false';
            const lockIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 0 0-3 3v2H3.5A1.5 1.5 0 0 0 2 7.5v6A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 12.5 6H11V4a3 3 0 0 0-3-3zm2 5V4a2 2 0 1 0-4 0v2h4z"/></svg>`;
            const unlockIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 0 1 3 3v2h1.5A1.5 1.5 0 0 1 14 7.5v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5v-6A1.5 1.5 0 0 1 3.5 6H10V4a2 2 0 1 0-4 0v.5a.5.5 0 0 1-1 0V4a3 3 0 0 1 3-3z"/></svg>`;
            
            lockBtn.innerHTML = isLocked 
                ? lockIcon + ' Locked' 
                : unlockIcon + ' Unlocked';
            lockBtn.classList.toggle('unlocked', !isLocked);
            lockBtn.title = isLocked ? 'Click to unlock and edit locations' : 'Click to lock locations';
        }
    }

    handleCompoundDragStart(e) {
        this.draggedCompoundElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    handleCompoundDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        
        const target = e.target.closest('.death-cause-item');
        if (target && target !== this.draggedCompoundElement) {
            target.classList.add('drag-over');
        }
        
        return false;
    }

    handleCompoundDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        const target = e.target.closest('.death-cause-item');
        if (this.draggedCompoundElement !== target && target) {
            const draggedCompound = this.draggedCompoundElement.dataset.compound;
            const targetCompound = target.dataset.compound;
            
            const profile = this.getCurrentProfile();
            const draggedIndex = profile.compoundOrder.indexOf(draggedCompound);
            const targetIndex = profile.compoundOrder.indexOf(targetCompound);
            
            profile.compoundOrder.splice(draggedIndex, 1);
            const newTargetIndex = profile.compoundOrder.indexOf(targetCompound);
            profile.compoundOrder.splice(newTargetIndex, 0, draggedCompound);
            
            this.saveData();
            this.renderCompounds();
        }

        target?.classList.remove('drag-over');
        return false;
    }

    handleCompoundDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('#compoundList .death-cause-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    // ===== ANALYTICS CHARTS =====

    renderDeathCausePieChart() {
        const canvas = document.getElementById('deathCausePieChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const profile = this.getCurrentProfile();
        if (!profile || !profile.deaths || profile.deaths.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6b5d52';
            ctx.font = '14px Almendra';
            ctx.textAlign = 'center';
            ctx.fillText('No deaths recorded yet', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 350;

        // Count death causes
        const causeCounts = {};
        profile.deaths.forEach(death => {
            death.causes.forEach(cause => {
                causeCounts[cause] = (causeCounts[cause] || 0) + 1;
            });
        });

        const sortedCauses = Object.entries(causeCounts).sort((a, b) => b[1] - a[1]);
        const total = sortedCauses.reduce((sum, [_, count]) => sum + count, 0);

        // Colors
        const colors = [
            '#8b2e1f', '#d4af37', '#6b5d52', '#9b7653', '#c17735',
            '#734222', '#8f5a3c', '#a0826d', '#5c4033', '#6d4c41'
        ];

        // Draw pie chart
        const centerX = canvas.width / 2;
        const centerY = 160;
        const radius = 120;
        let currentAngle = -Math.PI / 2;

        sortedCauses.forEach(([cause, count], index) => {
            const sliceAngle = (count / total) * 2 * Math.PI;
            const color = colors[index % colors.length];

            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#0f0e0d';
            ctx.lineWidth = 2;
            ctx.stroke();

            currentAngle += sliceAngle;
        });

        // Draw legend
        const legendX = 20;
        let legendY = 300;
        ctx.font = '12px Almendra';
        ctx.textAlign = 'left';

        sortedCauses.slice(0, 5).forEach(([cause, count], index) => {
            const percentage = ((count / total) * 100).toFixed(1);
            const color = colors[index % colors.length];

            // Color box
            ctx.fillStyle = color;
            ctx.fillRect(legendX, legendY - 10, 15, 15);
            ctx.strokeStyle = '#d4af37';
            ctx.strokeRect(legendX, legendY - 10, 15, 15);

            // Text
            ctx.fillStyle = '#e8dcc4';
            const text = `${cause}: ${count} (${percentage}%)`;
            const maxLength = 35;
            const displayText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
            ctx.fillText(displayText, legendX + 20, legendY);

            legendY += 20;
        });
    }

    renderGunDeathChart() {
        const canvas = document.getElementById('gunDeathChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const profile = this.getCurrentProfile();
        if (!profile || !profile.gunDeaths || profile.gunDeaths.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6b5d52';
            ctx.font = '14px Almendra';
            ctx.textAlign = 'center';
            ctx.fillText('No gun deaths recorded yet', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 350;

        // Count gun deaths
        const gunCounts = {};
        profile.gunDeaths.forEach(gunDeath => {
            gunDeath.guns.forEach(gun => {
                gunCounts[gun] = (gunCounts[gun] || 0) + 1;
            });
        });

        const sortedGuns = Object.entries(gunCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (sortedGuns.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6b5d52';
            ctx.font = '14px Almendra';
            ctx.textAlign = 'center';
            ctx.fillText('No gun deaths recorded yet', canvas.width / 2, canvas.height / 2);
            return;
        }

        const maxCount = sortedGuns[0][1];
        const barHeight = 25;
        const barSpacing = 5;
        const leftMargin = 120;
        const maxBarWidth = canvas.width - leftMargin - 60;

        ctx.font = '12px Almendra';

        sortedGuns.forEach(([gun, count], index) => {
            const y = 20 + index * (barHeight + barSpacing);
            const barWidth = (count / maxCount) * maxBarWidth;

            // Gradient color based on count
            const intensity = count / maxCount;
            const r = Math.floor(139 * intensity + 107 * (1 - intensity));
            const g = Math.floor(46 * intensity + 93 * (1 - intensity));
            const b = Math.floor(31 * intensity + 82 * (1 - intensity));

            // Draw bar
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(leftMargin, y, barWidth, barHeight);
            ctx.strokeStyle = '#d4af37';
            ctx.strokeRect(leftMargin, y, barWidth, barHeight);

            // Gun name (left)
            ctx.fillStyle = '#e8dcc4';
            ctx.textAlign = 'right';
            ctx.fillText(gun, leftMargin - 10, y + barHeight / 2 + 4);

            // Count (on bar or after)
            ctx.textAlign = 'left';
            ctx.fillStyle = '#fff';
            if (barWidth > 30) {
                ctx.fillText(count, leftMargin + 5, y + barHeight / 2 + 4);
            } else {
                ctx.fillStyle = '#e8dcc4';
                ctx.fillText(count, leftMargin + barWidth + 5, y + barHeight / 2 + 4);
            }
        });
    }

    renderChart() {
        const canvas = document.getElementById('deathChart');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 350;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = 50;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2 - 40; // Extra space for legend

        // Get profiles to display
        const currentProfileName = this.currentProfile;
        const profilesToShow = [currentProfileName, ...this.comparedProfiles].filter(p => p);
        
        if (profilesToShow.length === 0) {
            ctx.fillStyle = '#a8967a';
            ctx.font = '16px Almendra, serif';
            ctx.textAlign = 'center';
            ctx.fillText('No profile selected', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Profile colors
        const profileColors = [
            { line: '#c4a572', point: '#d4af37', fill: 'rgba(196, 165, 114, 0.1)' }, // Gold
            { line: '#8b2e1f', point: '#a53a25', fill: 'rgba(139, 46, 31, 0.1)' },   // Red
            { line: '#4a7c59', point: '#5a9c6f', fill: 'rgba(74, 124, 89, 0.1)' },   // Green
            { line: '#6b5b95', point: '#8b7bb5', fill: 'rgba(107, 91, 149, 0.1)' },  // Purple
            { line: '#d4a574', point: '#e4b584', fill: 'rgba(212, 165, 116, 0.1)' }, // Orange
        ];

        // Collect all data
        const allSeriesData = [];
        let maxValue = 1;

        // For each selected death cause
        this.selectedDeathCauses.forEach((cause, causeIndex) => {
            const color = profileColors[causeIndex % profileColors.length];
            
            // For each profile
            profilesToShow.forEach((profileName) => {
                const causeData = this.getDeathCauseData(profileName, cause, 30);
                
                allSeriesData.push({
                    label: `${profileName} - ${cause}`,
                    data: causeData,
                    color: color,
                    showPoints: true
                });
                
                maxValue = Math.max(maxValue, ...causeData.map(d => d.count));
            });
        });

        if (allSeriesData.length === 0) {
            ctx.fillStyle = '#a8967a';
            ctx.font = '16px Almendra, serif';
            ctx.textAlign = 'center';
            ctx.fillText('Select death causes to compare', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Draw axes
        ctx.strokeStyle = '#4a3f2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding - 40);
        ctx.lineTo(canvas.width - padding, canvas.height - padding - 40);
        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = '#2a2419';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight * i) / 5;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
        }

        const pointSpacing = chartWidth / 29; // 30 days

        // Draw each series
        allSeriesData.forEach(series => {
            const data = series.data;
            
            // Draw line
            ctx.strokeStyle = series.color.line;
            ctx.lineWidth = 2.5;
            if (series.dashed) {
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }
            
            ctx.beginPath();
            data.forEach((point, index) => {
                const x = padding + index * pointSpacing;
                const y = canvas.height - padding - 40 - (point.count / maxValue) * chartHeight;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // Draw points
            if (series.showPoints) {
                data.forEach((point, index) => {
                    if (point.count > 0) {
                        const x = padding + index * pointSpacing;
                        const y = canvas.height - padding - 40 - (point.count / maxValue) * chartHeight;

                        ctx.fillStyle = series.color.point;
                        ctx.beginPath();
                        ctx.arc(x, y, 4, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }
        });

        ctx.setLineDash([]); // Reset dash

        // Draw labels
        ctx.fillStyle = '#a8967a';
        ctx.font = '11px Almendra, serif';
        ctx.textAlign = 'center';

        // X-axis labels (every 5 days)
        const firstDayData = allSeriesData[0].data;
        for (let i = 0; i < firstDayData.length; i += 5) {
            const x = padding + i * pointSpacing;
            const dateStr = firstDayData[i].date.getDate();
            ctx.fillText(dateStr, x, canvas.height - padding - 20);
        }

        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = Math.round((maxValue / 5) * i);
            const y = canvas.height - padding - 40 - (chartHeight * i) / 5;
            ctx.fillText(value, padding - 10, y + 4);
        }

        // Draw legend
        const legendY = canvas.height - 30;
        let legendX = padding;
        ctx.font = '11px Almendra, serif';
        ctx.textAlign = 'left';

        allSeriesData.forEach((series, index) => {
            // Draw line sample
            ctx.strokeStyle = series.color.line;
            ctx.lineWidth = 2;
            if (series.dashed) {
                ctx.setLineDash([3, 3]);
            } else {
                ctx.setLineDash([]);
            }
            ctx.beginPath();
            ctx.moveTo(legendX, legendY);
            ctx.lineTo(legendX + 20, legendY);
            ctx.stroke();

            // Draw text
            ctx.fillStyle = '#a8967a';
            ctx.fillText(series.label, legendX + 25, legendY + 4);

            legendX += ctx.measureText(series.label).width + 40;
            
            // Wrap to next line if needed
            if (legendX > canvas.width - padding - 100) {
                legendX = padding;
            }
        });

        ctx.setLineDash([]);
    }

    showNotification(message, isError = false) {
        // Simple notification - you can enhance this
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, ${isError ? '#a53a25' : '#8b2e1f'} 0%, ${isError ? '#7a1a0f' : '#5a1a10'} 100%);
            color: ${isError ? '#ffdddd' : '#d4af37'};
            padding: 20px 30px;
            border: 2px solid ${isError ? '#ff6666' : '#d4af37'};
            border-radius: 4px;
            z-index: 10000;
            font-family: 'Cinzel', serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveData() {
        localStorage.setItem('huntProfiles', JSON.stringify(this.profiles));
    }

    // ===== TEMPLATES SYSTEM =====

    renderTemplates() {
        const container = document.getElementById('templatesList');
        if (!container) return;

        container.innerHTML = '';

        if (this.templates.length === 0) {
            container.innerHTML = '<p class="empty-templates">No templates saved. Select causes/guns and click 💾 Save Template</p>';
            return;
        }

        this.templates.forEach((template, index) => {
            const templateBtn = document.createElement('div');
            templateBtn.className = 'template-button';
            
            const shortcutHint = index < 9 ? `<span class="template-shortcut">Ctrl+${index + 1}</span>` : '';
            
            templateBtn.innerHTML = `
                <span class="template-name">${template.name}</span>
                ${shortcutHint}
                <button class="btn-template-edit" title="Edit template">✏️</button>
                <button class="btn-template-delete" title="Delete template">×</button>
            `;

            templateBtn.querySelector('.template-name').addEventListener('click', () => {
                this.applyTemplate(template.id);
            });

            templateBtn.querySelector('.btn-template-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTemplate(template.id);
            });

            templateBtn.querySelector('.btn-template-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTemplate(template.id);
            });

            container.appendChild(templateBtn);
        });
    }

    openSaveTemplateModal() {
        // Get currently selected causes and guns
        const selectedCauses = [];
        document.querySelectorAll('#deathCauses input[type="checkbox"]:checked').forEach(cb => {
            selectedCauses.push(cb.value);
        });

        const selectedGuns = [];
        document.querySelectorAll('#gunList input[type="checkbox"]:checked').forEach(cb => {
            selectedGuns.push(cb.value);
        });

        // Get selected compound
        const selectedCompound = document.querySelector('#compoundList input[type="radio"]:checked');
        const compound = selectedCompound ? selectedCompound.value : null;

        if (selectedCauses.length === 0 && selectedGuns.length === 0) {
            alert('Please select at least one death cause or gun before saving a template!');
            return;
        }

        // Show preview
        const preview = document.getElementById('templatePreview');
        let previewHTML = '<div class="template-preview-content">';
        if (selectedCauses.length > 0) {
            previewHTML += `<div><strong>Causes:</strong> ${selectedCauses.join(', ')}</div>`;
        }
        if (selectedGuns.length > 0) {
            previewHTML += `<div><strong>Guns:</strong> ${selectedGuns.join(', ')}</div>`;
        }
        if (compound) {
            previewHTML += `<div><strong>Location:</strong> ${compound}</div>`;
        }
        previewHTML += '</div>';
        preview.innerHTML = previewHTML;

        // Clear input if creating new template, or populate if editing
        const nameInput = document.getElementById('templateName');
        if (this.editingTemplateId) {
            const template = this.templates.find(t => t.id === this.editingTemplateId);
            nameInput.value = template ? template.name : '';
            document.getElementById('templateModalTitle').textContent = 'Edit Template';
        } else {
            nameInput.value = '';
            document.getElementById('templateModalTitle').textContent = 'Save Death Template';
        }

        document.getElementById('saveTemplateModal').classList.add('active');
        nameInput.focus();
    }

    confirmSaveTemplate() {
        const nameInput = document.getElementById('templateName');
        const name = nameInput.value.trim();

        if (!name) {
            alert('Please enter a template name!');
            return;
        }

        // Get currently selected causes and guns
        const selectedCauses = [];
        document.querySelectorAll('#deathCauses input[type="checkbox"]:checked').forEach(cb => {
            selectedCauses.push(cb.value);
        });

        const selectedGuns = [];
        document.querySelectorAll('#gunList input[type="checkbox"]:checked').forEach(cb => {
            selectedGuns.push(cb.value);
        });

        const selectedCompound = document.querySelector('#compoundList input[type="radio"]:checked');
        const compound = selectedCompound ? selectedCompound.value : null;

        if (this.editingTemplateId) {
            // Edit existing template
            const template = this.templates.find(t => t.id === this.editingTemplateId);
            if (template) {
                template.name = name;
                template.causes = selectedCauses;
                template.guns = selectedGuns;
                template.compound = compound;
            }
            this.showNotification(`Template "${name}" updated`);
            this.editingTemplateId = null;
        } else {
            // Create new template
            const template = {
                id: Date.now(),
                name: name,
                causes: selectedCauses,
                guns: selectedGuns,
                compound: compound,
                created: new Date().toISOString()
            };
            this.templates.push(template);
            this.showNotification(`Template "${name}" saved`);
        }

        localStorage.setItem('huntTemplates', JSON.stringify(this.templates));
        document.getElementById('saveTemplateModal').classList.remove('active');
        this.renderTemplates();
    }

    applyTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        // Uncheck all causes and guns first
        document.querySelectorAll('#deathCauses input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item')?.classList.remove('selected');
        });
        document.querySelectorAll('#gunList input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item')?.classList.remove('selected');
        });

        // Check template causes
        template.causes.forEach(cause => {
            const checkbox = document.querySelector(`#deathCauses input[value="${cause}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.closest('.death-cause-item')?.classList.add('selected', 'template-applied');
            }
        });

        // Check template guns
        template.guns.forEach(gun => {
            const checkbox = document.querySelector(`#gunList input[value="${gun}"]`);
            if (checkbox) {
                checkbox.checked = true;
                checkbox.closest('.death-cause-item')?.classList.add('selected', 'template-applied');
            }
        });

        // Select compound
        if (template.compound) {
            const radio = document.querySelector(`#compoundList input[value="${template.compound}"]`);
            if (radio) {
                radio.checked = true;
                radio.closest('.death-cause-item')?.classList.add('selected', 'template-applied');
            }
        }

        // Brief highlight animation
        setTimeout(() => {
            document.querySelectorAll('.template-applied').forEach(item => {
                item.classList.remove('template-applied');
            });
        }, 1000);

        this.showNotification(`Template "${template.name}" applied`);
    }

    deleteTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        if (!confirm(`Delete template "${template.name}"?`)) {
            return;
        }

        this.templates = this.templates.filter(t => t.id !== templateId);
        localStorage.setItem('huntTemplates', JSON.stringify(this.templates));
        this.renderTemplates();
        this.showNotification(`Template "${template.name}" deleted`);
    }

    editTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        // Apply the template first to populate selections
        this.applyTemplate(templateId);
        
        // Set editing mode
        this.editingTemplateId = templateId;
        
        // Open modal after a brief delay to allow template to apply
        setTimeout(() => {
            this.openSaveTemplateModal();
        }, 100);
    }

    // ===== CORRELATIONS & PREDICTIONS =====

    calculateCorrelations() {
        const profile = this.getCurrentProfile();
        if (!profile || !profile.deaths || profile.deaths.length < 3) {
            this.correlations = { causes: {}, guns: {} };
            return;
        }

        const correlations = { causes: {}, guns: {} };

        // Calculate cause correlations
        profile.deaths.forEach(death => {
            death.causes.forEach(cause1 => {
                if (!correlations.causes[cause1]) {
                    correlations.causes[cause1] = {};
                }
                
                // Check co-occurrence with other causes
                death.causes.forEach(cause2 => {
                    if (cause1 !== cause2) {
                        correlations.causes[cause1][cause2] = (correlations.causes[cause1][cause2] || 0) + 1;
                    }
                });

                // Check co-occurrence with guns
                death.guns?.forEach(gun => {
                    if (!correlations.causes[cause1][gun]) {
                        correlations.causes[cause1][gun] = 0;
                    }
                    correlations.causes[cause1][gun]++;
                });
            });
        });

        // Normalize correlations to percentages
        Object.keys(correlations.causes).forEach(cause => {
            const total = profile.deaths.filter(d => d.causes.includes(cause)).length;
            Object.keys(correlations.causes[cause]).forEach(item => {
                correlations.causes[cause][item] = correlations.causes[cause][item] / total;
            });
        });

        this.correlations = correlations;
    }

    getSuggestions(selectedItems, type = 'causes') {
        if (selectedItems.length === 0 || Object.keys(this.correlations.causes).length === 0) {
            return [];
        }

        const suggestions = {};
        const threshold = 0.4;

        selectedItems.forEach(item => {
            if (this.correlations.causes[item]) {
                Object.entries(this.correlations.causes[item]).forEach(([correlatedItem, score]) => {
                    if (score >= threshold && !selectedItems.includes(correlatedItem)) {
                        suggestions[correlatedItem] = Math.max(suggestions[correlatedItem] || 0, score);
                    }
                });
            }
        });

        // Return top 3 suggestions sorted by score
        return Object.entries(suggestions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([item]) => item);
    }

    // ===== KEYBOARD SHORTCUTS =====

    attachKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl+Enter - Record Death
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                const recordBtn = document.getElementById('recordDeathBtn');
                if (recordBtn) recordBtn.click();
                return;
            }

            // Esc - Clear all selections
            if (e.key === 'Escape') {
                e.preventDefault();
                this.clearAllSelections();
                return;
            }

            // Ctrl+1-9 - Apply template
            if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const index = parseInt(e.key) - 1;
                if (this.templates[index]) {
                    this.applyTemplate(this.templates[index].id);
                }
                return;
            }

            // 1-5 - Jump to sections
            if (!e.ctrlKey && !e.shiftKey && !e.altKey && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                const sections = [
                    '.playbook-display',      // 1
                    '.stats-section',         // 2
                    '.death-form-section',    // 3
                    '.analytics-section',     // 4
                    '.death-ledger-section'   // 5
                ];
                
                const sectionIndex = parseInt(e.key) - 1;
                const section = document.querySelector(sections[sectionIndex]);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    section.classList.add('section-highlight');
                    setTimeout(() => section.classList.remove('section-highlight'), 500);
                }
                return;
            }
        });
    }

    clearAllSelections() {
        // Clear death causes
        document.querySelectorAll('#deathCauses input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item')?.classList.remove('selected');
        });

        // Clear guns
        document.querySelectorAll('#gunList input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item')?.classList.remove('selected');
        });

        // Clear compound
        document.querySelectorAll('#compoundList input[type="radio"]').forEach(radio => {
            radio.checked = false;
            radio.closest('.death-cause-item')?.classList.remove('selected');
        });

        // Clear K/D and notes
        const kdInput = document.getElementById('kdInput');
        if (kdInput) kdInput.value = '';
        
        const notesInput = document.getElementById('deathNotes');
        if (notesInput) notesInput.value = '';

        this.showNotification('All selections cleared');
    }

    attachEventListeners() {
        // Add profile button
        document.getElementById('addProfileBtn').addEventListener('click', () => {
            document.getElementById('profileModal').classList.add('active');
            document.getElementById('newProfileName').focus();
        });

        // Confirm profile creation
        document.getElementById('confirmProfileBtn').addEventListener('click', () => {
            const name = document.getElementById('newProfileName').value.trim();
            if (name) {
                if (this.profiles.find(p => p.name === name)) {
                    alert('A hunter with this name already exists!');
                    return;
                }
                this.createProfile(name);
                this.switchProfile(name);
                this.renderProfiles();
                this.renderQuickProfileSwitcher();
                document.getElementById('profileModal').classList.remove('active');
                document.getElementById('newProfileName').value = '';
            }
        });

        // Cancel profile creation
        document.getElementById('cancelProfileBtn').addEventListener('click', () => {
            document.getElementById('profileModal').classList.remove('active');
            document.getElementById('newProfileName').value = '';
        });

        // Enter key in profile modal
        document.getElementById('newProfileName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirmProfileBtn').click();
            }
        });

        // Rename modal handlers
        document.getElementById('confirmRenameBtn').addEventListener('click', () => {
            this.confirmRenameProfile();
        });

        document.getElementById('cancelRenameBtn').addEventListener('click', () => {
            document.getElementById('renameModal').classList.remove('active');
            this.profileToRename = null;
        });

        document.getElementById('renameProfileName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirmRenameBtn').click();
            }
        });

        // Delete modal handlers
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.confirmDeleteProfile();
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            document.getElementById('deleteModal').classList.remove('active');
            this.profileToDelete = null;
        });

        // Record death button
        document.getElementById('recordDeathBtn').addEventListener('click', () => {
            this.recordDeath();
        });

        // Add custom cause button
        document.getElementById('addCustomCause').addEventListener('click', () => {
            this.addCustomCause();
        });

        // Enter key in custom cause input
        document.getElementById('customCause').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomCause();
            }
        });

        // Lock/unlock button
        document.getElementById('lockEncountersBtn').addEventListener('click', () => {
            this.toggleLock();
        });

        // Record K/D button
        const kdBtn = document.getElementById('recordKDBtn');
        if (kdBtn) {
            kdBtn.addEventListener('click', () => {
                this.recordKD();
            });
        }

        // Gun tracking event listeners
        const recordGunBtn = document.getElementById('recordGunDeathBtn');
        if (recordGunBtn) {
            recordGunBtn.addEventListener('click', () => {
                this.recordGunDeath();
            });
        }

        const addCustomGunBtn = document.getElementById('addCustomGun');
        if (addCustomGunBtn) {
            addCustomGunBtn.addEventListener('click', () => {
                this.addCustomGun();
            });
        }

        const customGunInput = document.getElementById('customGun');
        if (customGunInput) {
            customGunInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCustomGun();
                }
            });
        }

        const lockGunsBtn = document.getElementById('lockGunsBtn');
        if (lockGunsBtn) {
            lockGunsBtn.addEventListener('click', () => {
                this.toggleGunsLock();
            });
        }

        // Playbook event listeners
        const playbookBtn = document.getElementById('playbookBtn');
        if (playbookBtn) {
            playbookBtn.addEventListener('click', () => {
                this.openPlaybook();
            });
        }

        const savePlaybookBtn = document.getElementById('savePlaybookBtn');
        if (savePlaybookBtn) {
            savePlaybookBtn.addEventListener('click', () => {
                this.savePlaybook();
                document.getElementById('playbookModal').classList.remove('active');
            });
        }

        const cancelPlaybookBtn = document.getElementById('cancelPlaybookBtn');
        if (cancelPlaybookBtn) {
            cancelPlaybookBtn.addEventListener('click', () => {
                document.getElementById('playbookModal').classList.remove('active');
            });
        }

        // Compound tracking event listeners
        const addCustomCompoundBtn = document.getElementById('addCustomCompound');
        if (addCustomCompoundBtn) {
            addCustomCompoundBtn.addEventListener('click', () => {
                this.addCustomCompound();
            });
        }

        const customCompoundInput = document.getElementById('customCompound');
        if (customCompoundInput) {
            customCompoundInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCustomCompound();
                }
            });
        }

        const lockCompoundsBtn = document.getElementById('lockCompoundsBtn');
        if (lockCompoundsBtn) {
            lockCompoundsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering collapse
                this.toggleCompoundsLock();
            });
        }

        // Collapsible compounds section
        const compoundsHeader = document.getElementById('compoundsHeader');
        if (compoundsHeader) {
            compoundsHeader.addEventListener('click', (e) => {
                // Don't toggle if clicking the lock button
                if (e.target.closest('.btn-lock-encounters')) return;
                
                const content = document.getElementById('compoundsContent');
                compoundsHeader.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            });
        }

        // Template event listeners
        const saveTemplateBtn = document.getElementById('saveTemplateBtn');
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', () => {
                this.openSaveTemplateModal();
            });
        }

        const confirmSaveTemplateBtn = document.getElementById('confirmSaveTemplateBtn');
        if (confirmSaveTemplateBtn) {
            confirmSaveTemplateBtn.addEventListener('click', () => {
                this.confirmSaveTemplate();
            });
        }

        const cancelSaveTemplateBtn = document.getElementById('cancelSaveTemplateBtn');
        if (cancelSaveTemplateBtn) {
            cancelSaveTemplateBtn.addEventListener('click', () => {
                document.getElementById('saveTemplateModal').classList.remove('active');
                this.editingTemplateId = null;
            });
        }

        const templateNameInput = document.getElementById('templateName');
        if (templateNameInput) {
            templateNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmSaveTemplateBtn.click();
                }
            });
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new DeathTracker();
});
