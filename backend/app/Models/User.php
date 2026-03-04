<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'weight_kg',
        'height_cm',
        'age',
        'sex',
        'activity_factor',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'weight_kg'         => 'decimal:2',
        'height_cm'         => 'decimal:2',
        'age'               => 'integer',
    ];

    // ── Relaciones ──────────────────────────────

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }
}
