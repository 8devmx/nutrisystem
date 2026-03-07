<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'api_token',
        'weight_kg',
        'height_cm',
        'target_weight_kg',
        'age',
        'sex',
        'activity_factor',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'api_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'weight_kg'         => 'decimal:2',
        'height_cm'         => 'decimal:2',
        'target_weight_kg'  => 'decimal:2',
        'age'               => 'integer',
    ];

    public function createApiToken(): string
    {
        $this->api_token = Str::random(60);
        $this->save();
        return $this->api_token;
    }

    public function deleteApiToken(): void
    {
        $this->api_token = null;
        $this->save();
    }

    // ── Relaciones ──────────────────────────────

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }
}
