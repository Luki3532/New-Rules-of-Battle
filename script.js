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
            'medium range'
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
        });

        this.renderProfiles();
        this.renderQuickProfileSwitcher();
        this.renderDeathCauses();
        this.renderGuns();
        this.updateStats();
        this.renderDeathCauseToggles();
        this.renderProfileCompare();
        this.renderKDProfileCompare();
        this.updateChartVisibility();
        this.renderChart();
        this.renderKDChart();
        this.attachEventListeners();
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
        this.updateStats();
        this.updateChartVisibility();
        this.renderProfileCompare();
        this.renderKDProfileCompare();
        this.renderChart();
        this.renderKDChart();
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

        allCauses.forEach((cause, index) => {
            const isCustom = customCauses.includes(cause);
            const item = document.createElement('div');
            item.className = 'death-cause-item';
            item.draggable = !this.isLocked;
            item.dataset.cause = cause;
            
            if (!this.isLocked) {
                item.classList.add('unlocked');
            }

            item.innerHTML = `
                ${!this.isLocked ? '<div class="drag-handle" title="Drag to reorder">⋮⋮</div>' : ''}
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
            });

            // Add delete button listener if unlocked
            if (!this.isLocked) {
                const deleteBtn = item.querySelector('.btn-remove-cause');
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.removeCause(cause, isCustom);
                });

                // Add drag and drop listeners
                item.addEventListener('dragstart', (e) => this.handleDragStart(e));
                item.addEventListener('dragover', (e) => this.handleDragOver(e));
                item.addEventListener('drop', (e) => this.handleDrop(e));
                item.addEventListener('dragend', (e) => this.handleDragEnd(e));
            }

            causesContainer.appendChild(item);
        });

        // Update lock button UI
        this.updateLockButton();
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

        const notes = document.getElementById('deathNotes').value.trim();

        const death = {
            id: Date.now(),
            causes: selectedCauses,
            notes: notes,
            timestamp: new Date().toISOString()
        };

        profile.deaths.unshift(death);
        this.saveData();

        // Clear form
        document.querySelectorAll('.death-cause-item input:checked').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item').classList.remove('selected');
        });
        document.getElementById('deathNotes').value = '';

        // Update UI
        this.updateStats();
        this.renderChart();

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

        allGuns.forEach((gun, index) => {
            const isCustom = customGuns.includes(gun);
            const item = document.createElement('div');
            item.className = 'death-cause-item';
            item.draggable = !isGunsLocked;
            item.dataset.gun = gun;
            
            if (!isGunsLocked) {
                item.classList.add('unlocked');
            }

            item.innerHTML = `
                ${!isGunsLocked ? '<div class="drag-handle" title="Drag to reorder">⋮⋮</div>' : ''}
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
            });

            if (!isGunsLocked) {
                const deleteBtn = item.querySelector('.btn-remove-cause');
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.removeGun(gun, isCustom);
                });

                item.addEventListener('dragstart', (e) => this.handleGunDragStart(e));
                item.addEventListener('dragover', (e) => this.handleGunDragOver(e));
                item.addEventListener('drop', (e) => this.handleGunDrop(e));
                item.addEventListener('dragend', (e) => this.handleGunDragEnd(e));
            }

            gunsContainer.appendChild(item);
        });

        this.updateGunsLockButton();
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

        // Clear form
        document.querySelectorAll('#gunList .death-cause-item input:checked').forEach(cb => {
            cb.checked = false;
            cb.closest('.death-cause-item').classList.remove('selected');
        });

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
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new DeathTracker();
});
